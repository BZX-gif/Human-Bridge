import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  assessmentAttempts,
  assessmentDefenseQuestions,
  assessmentDefenseResponses,
  assessmentEvaluations,
  assessmentRubricScores,
  assessmentSections,
  scoreDimensions,
} from "@/db/schema";
import { ApiError } from "@/lib/api/response";
import { getEvaluationProvider } from "@/lib/ai";
import { recordEvent } from "@/lib/events";
import { applyRubric, clampScore, rubricSkillScores } from "@/lib/assessment/rubric-engine";
import { assessIntegrity, type ResponseMetadata } from "@/lib/assessment/integrity";
import {
  generateDeterministicDefenseQuestions,
  scoreDefenseAnswerDeterministically,
  type SubmissionExcerpt,
} from "@/lib/assessment/defense";
import {
  aggregateSkillScores,
  buildAttemptResult,
  computeOverallScore,
  computeReadiness,
  type SkillContribution,
} from "@/lib/assessment/scoring";
import type {
  AnswerKey,
  AttemptResult,
  EvaluatorType,
  PassingPolicy,
  RubricDefinition,
  ResponseValue,
  SectionScore,
} from "@/lib/assessment/types";
import {
  getAttemptResponses,
  getAttemptSubmissions,
  getBlueprint,
  getOwnedAttempt,
  getRubricsForBlueprint,
} from "./assessment-service";
import { applyAttemptEvidence } from "./skill-service";

/**
 * Evaluate a submitted attempt.
 *
 * Order of operations:
 *   deterministic auto-grading  →  rubric evaluation (AI when configured,
 *   deterministic heuristics otherwise)  →  integrity  →  section scores  →
 *   skill scores  →  readiness  →  pass decision  →  evidence  →  defense.
 *
 * The client never contributes a score at any point.
 */
export async function evaluateAttempt(
  attemptId: number,
  userId: number,
): Promise<AttemptResult> {
  const db = await getDb();
  const attempt = await getOwnedAttempt(attemptId, userId);

  if (attempt.status === "in_progress") {
    throw new ApiError("ATTEMPT_NOT_SUBMITTED", "Submit the assessment before evaluating it.");
  }

  await db
    .update(assessmentAttempts)
    .set({ status: "evaluating", updatedAt: new Date() })
    .where(eq(assessmentAttempts.id, attemptId));

  const blueprint = await getBlueprint(String(attempt.blueprintId));
  const policy = blueprint.passingPolicy;
  const rubricRows = await getRubricsForBlueprint(attempt.blueprintId);
  const rubrics = new Map<string, RubricDefinition>(
    rubricRows.map((r) => [
      r.key,
      { key: r.key, title: r.title, criteria: r.criteria as RubricDefinition["criteria"] },
    ]),
  );

  const responses = await getAttemptResponses(attemptId);
  const submissions = await getAttemptSubmissions(attemptId);

  const provider = getEvaluationProvider();
  const aiAvailable = provider !== null;

  const sectionScores: SectionScore[] = [];
  const contributions: SkillContribution[] = [];
  const evidenceCollected: string[] = [];
  const longFormTexts: string[] = [];
  const itemMetadata: ResponseMetadata[] = [];
  let anyAiUsed = false;

  // Clear prior evaluations for this attempt so re-evaluation is idempotent.
  await db.delete(assessmentEvaluations).where(eq(assessmentEvaluations.attemptId, attemptId));

  for (const section of blueprint.sections) {
    if (section.kind === "defense") continue; // scored separately, after the defense round

    const sectionResponses = responses.filter((r) => r.section.id === section.id);
    for (const r of sectionResponses) {
      itemMetadata.push((r.response.metadata as ResponseMetadata) ?? {});
    }

    // ── Deterministically graded items ────────────────────────────────────
    const deterministic = sectionResponses.filter((r) => r.response.autoScore !== null);
    // ── Rubric-graded items (long form work) ──────────────────────────────
    const rubricItems = sectionResponses.filter((r) => {
      const key = r.item.answerKey as AnswerKey | null;
      return key?.kind === "rubric";
    });

    let deterministicScore: number | null = null;
    if (deterministic.length > 0) {
      const totalPoints = deterministic.reduce((sum, r) => sum + Math.max(1, r.item.points), 0);
      const earned = deterministic.reduce(
        (sum, r) => sum + (r.response.autoScore ?? 0) * Math.max(1, r.item.points),
        0,
      );
      deterministicScore = clampScore(earned / totalPoints);
      for (const r of deterministic) {
        for (const slug of (r.item.skillSlugs as string[]) ?? []) {
          contributions.push({
            skillSlug: slug,
            score: r.response.autoScore ?? 0,
            sectionKey: section.key,
            sectionKind: section.kind,
            weight: section.weight,
          });
        }
      }
    }

    // ── Rubric evaluation ─────────────────────────────────────────────────
    let rubricScore: number | null = null;
    let evaluatorType: EvaluatorType = "deterministic";
    let notes: string | undefined;

    const rubricKey = await resolveSectionRubricKey(section.id);
    const rubric = rubricKey ? rubrics.get(rubricKey) : undefined;

    if (rubricItems.length > 0 && rubric) {
      const combinedSubmission = rubricItems
        .map((r) => {
          const value = r.response.response as ResponseValue | null;
          const text = value && value.kind === "text" ? value.text : "";
          return `### ${r.item.prompt}\n\n${text}`;
        })
        .join("\n\n---\n\n");

      for (const r of rubricItems) {
        const value = r.response.response as ResponseValue | null;
        if (value?.kind === "text") longFormTexts.push(value.text);
      }

      const skillSlugs = Array.from(
        new Set(rubricItems.flatMap((r) => (r.item.skillSlugs as string[]) ?? [])),
      );

      let criterionScores: Record<string, number> = {};
      let criterionComments: Record<string, string> = {};
      let aiSkillScores: Record<string, number> = {};
      let evidence: string[] = [];
      let gaps: string[] = [];
      let feedback = "";
      let confidence: "low" | "medium" | "high" = "low";
      let status: "completed" | "unavailable" = "completed";
      let unavailableReason: string | null = null;
      let providerName: string | null = null;
      let modelName: string | null = null;

      if (provider) {
        const result = await provider.evaluateSubmission({
          role: blueprint.targetRole ?? "Candidate",
          skillSlugs,
          sectionTitle: section.title,
          taskPrompt: rubricItems.map((r) => r.item.prompt).join("\n\n"),
          submission: combinedSubmission,
          rubric: rubric.criteria.map((c) => ({
            key: c.key,
            label: c.label,
            weight: c.weight,
            guidance: c.guidance,
          })),
          constraints: [
            "Score strictly against the rubric criteria provided.",
            "Award no credit for work that is not present in the submission.",
            "Ignore education, institution and demographic information entirely.",
          ],
        });

        if (result.ok) {
          anyAiUsed = true;
          evaluatorType = "ai";
          criterionScores = result.data.rubricScores;
          aiSkillScores = result.data.skillScores;
          evidence = result.data.evidence;
          gaps = result.data.gaps;
          feedback = result.data.feedback;
          confidence = result.data.confidence;
          providerName = result.provider;
          modelName = result.model;
        } else {
          status = "unavailable";
          unavailableReason = result.reason;
        }
      } else {
        status = "unavailable";
        unavailableReason = "No AI evaluation provider is configured.";
      }

      if (status === "unavailable") {
        // Honest degradation: deterministic coverage heuristics only, and we say so.
        evaluatorType = "deterministic";
        const heuristic = deterministicRubricFallback(rubricItems, rubric);
        criterionScores = heuristic.criterionScores;
        criterionComments = heuristic.comments;
        evidence = heuristic.evidence;
        gaps = heuristic.gaps;
        confidence = "low";
        feedback =
          "Automated AI evaluation is currently unavailable. This section was scored using deterministic coverage checks only, which are conservative and capped. Your submission has been saved in full and can be re-evaluated or reviewed by a human.";
        notes = "AI evaluation unavailable — deterministic scoring only.";
      }

      const rubricResult = applyRubric(rubric, criterionScores, criterionComments);
      rubricScore = rubricResult.score;

      const [evaluation] = await db
        .insert(assessmentEvaluations)
        .values({
          attemptId,
          sectionId: section.id,
          evaluatorType,
          provider: providerName,
          model: modelName,
          status,
          score: rubricScore,
          confidence,
          rubricScores: rubricResult.criterionScores,
          skillScores: aiSkillScores,
          evidence,
          gaps,
          feedback,
          unavailableReason,
          humanReviewRequired: status === "unavailable",
        })
        .returning();

      for (const cs of rubricResult.criterionScores) {
        await db.insert(assessmentRubricScores).values({
          evaluationId: evaluation.id,
          criterionKey: cs.key,
          label: cs.label,
          score: cs.score,
          weight: cs.weight,
          comment: cs.comment,
        });
      }

      // Skill contributions: prefer the rubric→skill mapping, blend AI opinion.
      const mapped = rubricSkillScores(rubric, rubricResult);
      const merged: Record<string, number> = { ...mapped };
      for (const [slug, value] of Object.entries(aiSkillScores)) {
        merged[slug] = merged[slug] === undefined ? value : clampScore((merged[slug] + value) / 2);
      }
      for (const [slug, value] of Object.entries(merged)) {
        contributions.push({
          skillSlug: slug,
          score: value,
          sectionKey: section.key,
          sectionKind: section.kind,
          weight: section.weight,
        });
      }

      evidenceCollected.push(section.title);
    } else if (deterministicScore !== null) {
      evidenceCollected.push(section.title);
    }

    const combined =
      rubricScore !== null && deterministicScore !== null
        ? clampScore(rubricScore * 0.7 + deterministicScore * 0.3)
        : (rubricScore ?? deterministicScore);

    sectionScores.push({
      sectionKey: section.key,
      sectionKind: section.kind,
      title: section.title,
      weight: section.weight,
      score: combined ?? 0,
      maxScore: 100,
      evaluated: combined !== null,
      evaluatorType,
      notes,
    });
  }

  // ── Defense section ────────────────────────────────────────────────────
  const defenseSection = blueprint.sections.find((s) => s.kind === "defense");
  if (defenseSection) {
    const defenseResponses = await db
      .select()
      .from(assessmentDefenseResponses)
      .where(eq(assessmentDefenseResponses.attemptId, attemptId));

    if (defenseResponses.length > 0) {
      const scored = defenseResponses.filter((r) => r.score !== null);
      const defenseScore =
        scored.length === 0
          ? 0
          : clampScore(scored.reduce((sum, r) => sum + (r.score ?? 0), 0) / scored.length);

      const defenseRubricKey = await resolveSectionRubricKey(defenseSection.id);
      const defenseRubric = defenseRubricKey ? rubrics.get(defenseRubricKey) : undefined;

      sectionScores.push({
        sectionKey: defenseSection.key,
        sectionKind: "defense",
        title: defenseSection.title,
        weight: defenseSection.weight,
        score: defenseScore,
        maxScore: 100,
        evaluated: true,
        evaluatorType: defenseResponses[0]?.evaluatorType ?? "deterministic",
      });

      const questions = await db
        .select()
        .from(assessmentDefenseQuestions)
        .where(eq(assessmentDefenseQuestions.attemptId, attemptId));
      const questionById = new Map(questions.map((q) => [q.id, q]));

      for (const response of defenseResponses) {
        const slug = questionById.get(response.questionId)?.targetSkillSlug;
        if (!slug) continue;
        contributions.push({
          skillSlug: slug,
          score: response.score ?? 0,
          sectionKey: defenseSection.key,
          sectionKind: "defense",
          weight: defenseSection.weight,
        });
      }
      if (defenseRubric) evidenceCollected.push(defenseSection.title);
      else evidenceCollected.push("Defense round");
    } else {
      sectionScores.push({
        sectionKey: defenseSection.key,
        sectionKind: "defense",
        title: defenseSection.title,
        weight: defenseSection.weight,
        score: 0,
        maxScore: 100,
        evaluated: false,
        evaluatorType: "deterministic",
        notes: "Defense round not yet completed.",
      });
    }
  }

  // ── Integrity ──────────────────────────────────────────────────────────
  const integrity = assessIntegrity({
    totalTimeSeconds: attempt.timeSpentSeconds,
    expectedMinimumSeconds: Math.round(blueprint.durationMinutes * 60 * 0.15),
    itemMetadata,
    longFormTexts,
  });

  // ── Aggregate ──────────────────────────────────────────────────────────
  const skillScores = aggregateSkillScores(contributions);
  const overallScore = computeOverallScore(sectionScores);
  const essentialSkillSlugs = await getEssentialSkillSlugs(blueprint.careerId);
  const readinessScore = computeReadiness(
    overallScore,
    skillScores,
    essentialSkillSlugs,
    policy,
  );

  const humanReviewRequired =
    integrity.status === "flagged" || (!aiAvailable && hasRubricSections(sectionScores));

  const result = buildAttemptResult({
    overallScore,
    readinessScore,
    sectionScores,
    skillScores,
    essentialSkillSlugs,
    policy,
    integrityStatus: integrity.status,
    evaluatorType: anyAiUsed ? "hybrid" : "deterministic",
    aiEvaluationAvailable: aiAvailable,
    humanReviewRequired,
    evidenceCollected: Array.from(new Set(evidenceCollected)),
  });

  // ── Multi-dimensional scoring ─────────────────────────────────────────
  // Never reduce a candidate to one number. Persist the weighted dimensions
  // (section scores + every rubric criterion) so profiles can show e.g.
  // Technical knowledge vs Practical execution vs Communication separately.
  const rubricScoreRows = await db
    .select({ score: assessmentRubricScores, sectionKey: assessmentSections.key })
    .from(assessmentRubricScores)
    .innerJoin(
      assessmentEvaluations,
      eq(assessmentEvaluations.id, assessmentRubricScores.evaluationId),
    )
    .innerJoin(assessmentSections, eq(assessmentSections.id, assessmentEvaluations.sectionId))
    .where(eq(assessmentEvaluations.attemptId, attemptId));

  await db.delete(scoreDimensions).where(eq(scoreDimensions.attemptId, attemptId));
  const dimensionValues: (typeof scoreDimensions.$inferInsert)[] = [
    ...sectionScores.map((s) => ({
      attemptId,
      key: `section.${s.sectionKey}`,
      label: s.title,
      score: s.score ?? 0,
      weight: s.weight,
      source: "section",
    })),
    ...rubricScoreRows.map((r) => ({
      attemptId,
      key: `${r.sectionKey}.${r.score.criterionKey}`,
      label: r.score.label ?? r.score.criterionKey,
      score: r.score.score,
      weight: r.score.weight,
      source: "rubric",
    })),
  ];
  if (dimensionValues.length > 0) {
    await db.insert(scoreDimensions).values(dimensionValues).onConflictDoNothing();
  }

  const defenseDone = sectionScores.some((s) => s.sectionKind === "defense" && s.evaluated);
  const nextStatus = defenseDone
    ? result.passed
      ? "passed"
      : "failed"
    : "defense";

  await db
    .update(assessmentAttempts)
    .set({
      status: nextStatus,
      overallScore,
      readinessScore,
      passed: defenseDone ? result.passed : null,
      resultSummary: result,
      integrityStatus: integrity.status,
      integritySignals: integrity.signals,
      evaluatorType: result.evaluatorType,
      completedAt: defenseDone ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(assessmentAttempts.id, attemptId));

  await recordEvent({
    type: defenseDone ? "assessment.completed" : "assessment.evaluated",
    userId,
    attemptId,
    payload: { overallScore, readinessScore, passed: result.passed, aiAvailable },
  });

  // Evidence is written to the passport only once the full loop is complete.
  if (defenseDone) {
    await applyAttemptEvidence(userId, attemptId, blueprint.title, result);
  }

  return result;
}

function hasRubricSections(sectionScores: SectionScore[]): boolean {
  return sectionScores.some((s) => s.sectionKind === "practical" && s.evaluated);
}

async function resolveSectionRubricKey(sectionId: number): Promise<string | null> {
  const db = await getDb();
  const { assessmentSections: sec, assessmentRubrics: rub } = await import("@/db/schema");
  const rows = await db
    .select({ key: rub.key })
    .from(sec)
    .leftJoin(rub, eq(rub.id, sec.rubricId))
    .where(eq(sec.id, sectionId))
    .limit(1);
  return rows[0]?.key ?? null;
}

async function getEssentialSkillSlugs(careerId: number | null): Promise<string[]> {
  if (careerId === null) return [];
  const db = await getDb();
  const { careerSkills, skills } = await import("@/db/schema");
  const { and: andOp } = await import("drizzle-orm");
  const rows = await db
    .select({ slug: skills.slug })
    .from(careerSkills)
    .innerJoin(skills, eq(skills.id, careerSkills.skillId))
    .where(andOp(eq(careerSkills.careerId, careerId), eq(careerSkills.importance, "essential")));
  return rows.map((r) => r.slug);
}

interface RubricItemRow {
  response: { response: unknown };
  item: { answerKey: unknown; skillSlugs: unknown; prompt: string };
}

/**
 * Deterministic fallback when no AI provider is configured.
 * Scores are intentionally conservative and capped — we never pretend a
 * keyword heuristic is a rubric judgement.
 */
function deterministicRubricFallback(
  rubricItems: RubricItemRow[],
  rubric: RubricDefinition,
): {
  criterionScores: Record<string, number>;
  comments: Record<string, string>;
  evidence: string[];
  gaps: string[];
} {
  const evidence: string[] = [];
  const gaps: string[] = [];
  let totalCoverage = 0;
  let counted = 0;

  for (const row of rubricItems) {
    const key = row.item.answerKey as AnswerKey | null;
    if (key?.kind !== "rubric") continue;
    const value = row.response.response as ResponseValue | null;
    const text = value?.kind === "text" ? value.text.toLowerCase() : "";
    const points = key.expectedPoints ?? [];
    if (points.length === 0) continue;

    let hits = 0;
    for (const point of points) {
      if (point.any.some((needle) => text.includes(needle.toLowerCase()))) {
        hits += 1;
        evidence.push(`Covered: ${point.label}`);
      } else {
        gaps.push(`Not addressed: ${point.label}`);
      }
    }
    totalCoverage += hits / points.length;
    counted += 1;
  }

  const coverage = counted === 0 ? 0 : totalCoverage / counted;
  // Cap at 65 — deterministic coverage can show competence, never excellence.
  const score = clampScore(coverage * 65);

  const criterionScores: Record<string, number> = {};
  const comments: Record<string, string> = {};
  for (const criterion of rubric.criteria) {
    criterionScores[criterion.key] = score;
    comments[criterion.key] =
      "Deterministic coverage estimate — AI evaluation unavailable.";
  }

  return { criterionScores, comments, evidence: evidence.slice(0, 12), gaps: gaps.slice(0, 12) };
}

// ─── Defense round ─────────────────────────────────────────────────────────

export interface DefenseQuestionView {
  id: number;
  question: string;
  sourceExcerpt: string | null;
  targetSkillSlug: string | null;
  order: number;
  answered: boolean;
}

/** Generate defense questions from what the candidate actually submitted. */
export async function generateDefense(
  attemptId: number,
  userId: number,
): Promise<DefenseQuestionView[]> {
  const db = await getDb();
  const attempt = await getOwnedAttempt(attemptId, userId);

  const existing = await db
    .select()
    .from(assessmentDefenseQuestions)
    .where(eq(assessmentDefenseQuestions.attemptId, attemptId))
    .orderBy(assessmentDefenseQuestions.order);

  const answered = await db
    .select({ questionId: assessmentDefenseResponses.questionId })
    .from(assessmentDefenseResponses)
    .where(eq(assessmentDefenseResponses.attemptId, attemptId));
  const answeredIds = new Set(answered.map((a) => a.questionId));

  if (existing.length > 0) {
    return existing.map((q) => ({
      id: q.id,
      question: q.question,
      sourceExcerpt: q.sourceExcerpt,
      targetSkillSlug: q.targetSkillSlug,
      order: q.order,
      answered: answeredIds.has(q.id),
    }));
  }

  if (attempt.status === "in_progress") {
    throw new ApiError("DEFENSE_NOT_READY", "Submit your work before the defense round.");
  }

  const blueprint = await getBlueprint(String(attempt.blueprintId));
  const defenseSection = blueprint.sections.find((s) => s.kind === "defense");
  const maxQuestions = Number(defenseSection?.config?.maxQuestions ?? 4);

  const responses = await getAttemptResponses(attemptId);
  const excerpts: SubmissionExcerpt[] = responses
    .map((r) => {
      const value = r.response.response as ResponseValue | null;
      return {
        itemKey: r.item.key,
        skillSlugs: (r.item.skillSlugs as string[]) ?? [],
        text: value?.kind === "text" ? value.text : "",
      };
    })
    .filter((e) => e.text.trim().length > 20);

  const provider = getEvaluationProvider();
  let generated = generateDeterministicDefenseQuestions(excerpts, maxQuestions);
  let generatedBy: EvaluatorType = "deterministic";

  if (provider && excerpts.length > 0) {
    const result = await provider.generateDefenseQuestions({
      role: blueprint.targetRole ?? "Candidate",
      submission: excerpts.map((e) => `## ${e.itemKey}\n${e.text}`).join("\n\n"),
      skillSlugs: Array.from(new Set(excerpts.flatMap((e) => e.skillSlugs))),
      maxQuestions,
    });
    if (result.ok && result.data.length > 0) {
      generated = result.data;
      generatedBy = "ai";
    }
  }

  const inserted = await db
    .insert(assessmentDefenseQuestions)
    .values(
      generated.map((q, index) => ({
        attemptId,
        question: q.question,
        rationale: q.rationale,
        sourceExcerpt: q.sourceExcerpt,
        targetSkillSlug: q.targetSkillSlug || null,
        expectedPoints: q.expectedPoints,
        generatedBy,
        order: index,
      })),
    )
    .returning();

  await db
    .update(assessmentAttempts)
    .set({ status: "defense", updatedAt: new Date() })
    .where(eq(assessmentAttempts.id, attemptId));

  await recordEvent({
    type: "defense.generated",
    userId,
    attemptId,
    payload: { count: inserted.length, generatedBy },
  });

  return inserted.map((q) => ({
    id: q.id,
    question: q.question,
    sourceExcerpt: q.sourceExcerpt,
    targetSkillSlug: q.targetSkillSlug,
    order: q.order,
    answered: false,
  }));
}

export interface DefenseAnswerInput {
  questionId: number;
  answer: string;
  timeSpentSeconds?: number;
}

/** Score a defense answer server-side. */
export async function answerDefense(
  attemptId: number,
  userId: number,
  input: DefenseAnswerInput,
): Promise<{ recorded: true; remaining: number }> {
  const db = await getDb();
  const attempt = await getOwnedAttempt(attemptId, userId);

  const [question] = await db
    .select()
    .from(assessmentDefenseQuestions)
    .where(eq(assessmentDefenseQuestions.id, input.questionId))
    .limit(1);

  if (!question || question.attemptId !== attemptId) {
    throw new ApiError("NOT_FOUND", "Defense question not found.");
  }

  const blueprint = await getBlueprint(String(attempt.blueprintId));
  const expectedPoints = (question.expectedPoints as string[]) ?? [];
  const provider = getEvaluationProvider();

  let score: number;
  let evaluatorType: EvaluatorType = "deterministic";
  let evaluation: Record<string, unknown>;

  const aiResult = provider
    ? await provider.evaluateDefense({
        role: blueprint.targetRole ?? "Candidate",
        question: question.question,
        expectedPoints,
        answer: input.answer,
        originalSubmissionExcerpt: question.sourceExcerpt ?? "",
      })
    : null;

  if (aiResult?.ok) {
    score = clampScore(aiResult.data.score);
    evaluatorType = "ai";
    evaluation = {
      confidence: aiResult.data.confidence,
      understanding: aiResult.data.understanding,
      evidence: aiResult.data.evidence,
      gaps: aiResult.data.gaps,
      provider: aiResult.provider,
      model: aiResult.model,
    };
  } else {
    const deterministic = scoreDefenseAnswerDeterministically(
      input.answer,
      expectedPoints,
      question.sourceExcerpt ?? "",
    );
    score = deterministic.score;
    evaluation = {
      confidence: "low",
      understanding: deterministic.notes,
      evidence: deterministic.matchedPoints,
      gaps: expectedPoints.filter((p) => !deterministic.matchedPoints.includes(p)),
      aiUnavailableReason: aiResult ? aiResult.reason : "No AI provider configured.",
      scoreCapped: deterministic.capped,
    };
  }

  await db
    .insert(assessmentDefenseResponses)
    .values({
      questionId: input.questionId,
      attemptId,
      answer: input.answer,
      score,
      evaluation,
      evaluatorType,
      timeSpentSeconds: Math.max(0, Math.round(input.timeSpentSeconds ?? 0)),
    })
    .onConflictDoUpdate({
      target: [assessmentDefenseResponses.questionId],
      set: { answer: input.answer, score, evaluation, evaluatorType },
    });

  await recordEvent({ type: "defense.answered", userId, attemptId, payload: { score } });

  const allQuestions = await db
    .select()
    .from(assessmentDefenseQuestions)
    .where(eq(assessmentDefenseQuestions.attemptId, attemptId));
  const allAnswers = await db
    .select()
    .from(assessmentDefenseResponses)
    .where(eq(assessmentDefenseResponses.attemptId, attemptId));

  return { recorded: true, remaining: allQuestions.length - allAnswers.length };
}

export async function getAttemptEvaluations(attemptId: number) {
  const db = await getDb();
  return db
    .select()
    .from(assessmentEvaluations)
    .where(eq(assessmentEvaluations.attemptId, attemptId));
}

/** Human review — an employer or admin overrides/confirms an AI evaluation. */
export async function submitHumanReview(
  evaluationId: number,
  reviewerUserId: number,
  input: { score?: number; notes: string },
): Promise<void> {
  const db = await getDb();
  const [evaluation] = await db
    .select()
    .from(assessmentEvaluations)
    .where(eq(assessmentEvaluations.id, evaluationId))
    .limit(1);
  if (!evaluation) throw new ApiError("NOT_FOUND", "Evaluation not found.");

  await db
    .update(assessmentEvaluations)
    .set({
      score: input.score !== undefined ? clampScore(input.score) : evaluation.score,
      evaluatorType: evaluation.evaluatorType === "ai" ? "hybrid" : "human",
      status: "completed",
      humanReviewRequired: false,
      reviewedByUserId: reviewerUserId,
      reviewedAt: new Date(),
      reviewNotes: input.notes,
    })
    .where(eq(assessmentEvaluations.id, evaluationId));
}

export type { PassingPolicy };
