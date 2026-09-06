import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  assessmentAttempts,
  assessmentBlueprints,
  assessmentDefenseQuestions,
  assessmentDefenseResponses,
  assessmentItems,
  assessmentResponses,
  assessmentRubrics,
  assessmentSections,
  assessmentSubmissions,
} from "@/db/schema";
import { ApiError } from "@/lib/api/response";
import { recordEvent } from "@/lib/events";
import { gradeItem } from "@/lib/assessment/auto-grader";
import type {
  AnswerKey,
  ItemPayload,
  ItemType,
  PassingPolicy,
  ResponseValue,
  SectionKind,
} from "@/lib/assessment/types";
import type { ResponseMetadata } from "@/lib/assessment/integrity";

/** Item as sent to the browser — the answer key is stripped. */
export interface PublicItem {
  id: number;
  key: string;
  type: ItemType;
  prompt: string;
  helperText: string | null;
  payload: ItemPayload;
  skillSlugs: string[];
  points: number;
  order: number;
}

export interface PublicSection {
  id: number;
  key: string;
  kind: SectionKind;
  title: string;
  instructions: string | null;
  weight: number;
  order: number;
  timeLimitMinutes: number | null;
  config: Record<string, unknown>;
  items: PublicItem[];
}

export interface PublicBlueprint {
  id: number;
  slug: string;
  version: number;
  title: string;
  summary: string | null;
  targetRole: string | null;
  careerId: number | null;
  skillId: number | null;
  durationMinutes: number;
  assessmentType: string;
  difficulty: string;
  scoringMethod: string;
  antiCheatConfig: Record<string, boolean>;
  toolsAllowed: string[];
  aiPolicy: string | null;
  passingPolicy: PassingPolicy;
  sections: PublicSection[];
}

/** Load a published blueprint by slug (latest version) or by numeric id. */
export async function getBlueprint(idOrSlug: string): Promise<PublicBlueprint> {
  const db = await getDb();
  const numericId = Number(idOrSlug);

  const rows = Number.isInteger(numericId) && String(numericId) === idOrSlug
    ? await db
        .select()
        .from(assessmentBlueprints)
        .where(eq(assessmentBlueprints.id, numericId))
        .limit(1)
    : await db
        .select()
        .from(assessmentBlueprints)
        .where(
          and(
            eq(assessmentBlueprints.slug, idOrSlug),
            eq(assessmentBlueprints.status, "published"),
          ),
        )
        .orderBy(desc(assessmentBlueprints.version))
        .limit(1);

  const blueprint = rows[0];
  if (!blueprint) {
    throw new ApiError("ASSESSMENT_NOT_FOUND", "Assessment not found.");
  }

  const sectionRows = await db
    .select()
    .from(assessmentSections)
    .where(eq(assessmentSections.blueprintId, blueprint.id))
    .orderBy(assessmentSections.order);

  const sectionIds = sectionRows.map((s) => s.id);
  const itemRows = sectionIds.length
    ? await db
        .select()
        .from(assessmentItems)
        .where(inArray(assessmentItems.sectionId, sectionIds))
        .orderBy(assessmentItems.order)
    : [];

  const sections: PublicSection[] = sectionRows.map((section) => ({
    id: section.id,
    key: section.key,
    kind: section.kind,
    title: section.title,
    instructions: section.instructions,
    weight: section.weight,
    order: section.order,
    timeLimitMinutes: section.timeLimitMinutes,
    config: (section.config as Record<string, unknown>) ?? {},
    items: itemRows
      .filter((item) => item.sectionId === section.id)
      .map((item) => ({
        // answerKey is deliberately NOT included.
        id: item.id,
        key: item.key,
        type: item.type,
        prompt: item.prompt,
        helperText: item.helperText,
        payload: (item.payload as ItemPayload) ?? {},
        skillSlugs: (item.skillSlugs as string[]) ?? [],
        points: item.points,
        order: item.order,
      })),
  }));

  return {
    id: blueprint.id,
    slug: blueprint.slug,
    version: blueprint.version,
    title: blueprint.title,
    summary: blueprint.summary,
    targetRole: blueprint.targetRole,
    careerId: blueprint.careerId,
    skillId: blueprint.skillId,
    durationMinutes: blueprint.durationMinutes,
    assessmentType: blueprint.assessmentType,
    difficulty: blueprint.difficulty,
    scoringMethod: blueprint.scoringMethod,
    antiCheatConfig: (blueprint.antiCheatConfig as Record<string, boolean>) ?? {},
    toolsAllowed: (blueprint.toolsAllowed as string[]) ?? [],
    aiPolicy: blueprint.aiPolicy,
    passingPolicy: blueprint.passingPolicy as PassingPolicy,
    sections,
  };
}

export interface StartAttemptResult {
  attemptId: number;
  attemptNumber: number;
  status: string;
  expiresAt: Date | null;
  resumed: boolean;
}

/** Start a new attempt, or resume the candidate's in-progress attempt. */
export async function startAttempt(
  userId: number,
  blueprintIdOrSlug: string,
  jobId?: number,
): Promise<StartAttemptResult> {
  const db = await getDb();
  const blueprint = await getBlueprint(blueprintIdOrSlug);

  const existing = await db
    .select()
    .from(assessmentAttempts)
    .where(
      and(
        eq(assessmentAttempts.userId, userId),
        eq(assessmentAttempts.blueprintId, blueprint.id),
      ),
    )
    .orderBy(desc(assessmentAttempts.attemptNumber));

  const resumable = existing.find(
    (a) => a.status === "in_progress" || a.status === "defense",
  );
  if (resumable) {
    return {
      attemptId: resumable.id,
      attemptNumber: resumable.attemptNumber,
      status: resumable.status,
      expiresAt: resumable.expiresAt,
      resumed: true,
    };
  }

  const attemptNumber = (existing[0]?.attemptNumber ?? 0) + 1;
  const expiresAt = new Date(Date.now() + blueprint.durationMinutes * 60_000);

  const [created] = await db
    .insert(assessmentAttempts)
    .values({
      userId,
      blueprintId: blueprint.id,
      blueprintVersion: blueprint.version,
      jobId: jobId ?? null,
      attemptNumber,
      status: "in_progress",
      currentSectionKey: blueprint.sections[0]?.key ?? null,
      expiresAt,
    })
    .returning();

  await recordEvent({
    type: "assessment.started",
    userId,
    attemptId: created.id,
    payload: { blueprintSlug: blueprint.slug, version: blueprint.version, attemptNumber },
  });

  return {
    attemptId: created.id,
    attemptNumber,
    status: created.status,
    expiresAt: created.expiresAt,
    resumed: false,
  };
}

/** Load an attempt and verify it belongs to this user. */
export async function getOwnedAttempt(attemptId: number, userId: number) {
  const db = await getDb();
  const [attempt] = await db
    .select()
    .from(assessmentAttempts)
    .where(eq(assessmentAttempts.id, attemptId))
    .limit(1);

  if (!attempt) throw new ApiError("ATTEMPT_NOT_FOUND", "Assessment attempt not found.");
  if (attempt.userId !== userId) {
    // Do not leak the existence of another user's attempt.
    throw new ApiError("ATTEMPT_NOT_FOUND", "Assessment attempt not found.");
  }
  return attempt;
}

export interface SaveResponseInput {
  itemKey: string;
  response: ResponseValue;
  metadata?: ResponseMetadata;
}

/**
 * Persist candidate responses. The browser sends answers ONLY — never scores.
 * Deterministic grading happens here, on the server.
 */
export async function saveResponses(
  attemptId: number,
  userId: number,
  sectionKey: string,
  inputs: SaveResponseInput[],
): Promise<{ saved: number }> {
  const db = await getDb();
  const attempt = await getOwnedAttempt(attemptId, userId);

  if (attempt.status !== "in_progress") {
    throw new ApiError(
      "ATTEMPT_ALREADY_SUBMITTED",
      "This attempt is no longer open for answers.",
    );
  }
  if (attempt.expiresAt && attempt.expiresAt.getTime() < Date.now()) {
    await db
      .update(assessmentAttempts)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(assessmentAttempts.id, attemptId));
    throw new ApiError("ATTEMPT_ALREADY_SUBMITTED", "This attempt has expired.");
  }

  const [section] = await db
    .select()
    .from(assessmentSections)
    .where(
      and(
        eq(assessmentSections.blueprintId, attempt.blueprintId),
        eq(assessmentSections.key, sectionKey),
      ),
    )
    .limit(1);
  if (!section) throw new ApiError("NOT_FOUND", "Section not found.");

  const items = await db
    .select()
    .from(assessmentItems)
    .where(eq(assessmentItems.sectionId, section.id));
  const itemsByKey = new Map(items.map((i) => [i.key, i]));

  let saved = 0;
  for (const input of inputs) {
    const item = itemsByKey.get(input.itemKey);
    if (!item) continue;

    const grade = gradeItem(item.answerKey as AnswerKey | null, input.response);

    await db
      .insert(assessmentResponses)
      .values({
        attemptId,
        itemId: item.id,
        response: input.response,
        // Only store an auto score when the grader could decide deterministically.
        autoScore: grade.deterministic ? grade.score : null,
        maxScore: 100,
        isCorrect: grade.deterministic ? grade.isCorrect : null,
        timeSpentSeconds: Math.max(0, Math.round(input.metadata?.timeSpentSeconds ?? 0)),
        revisions: Math.max(0, Math.round(input.metadata?.revisions ?? 0)),
        metadata: input.metadata ?? {},
      })
      .onConflictDoUpdate({
        target: [assessmentResponses.attemptId, assessmentResponses.itemId],
        set: {
          response: input.response,
          autoScore: grade.deterministic ? grade.score : null,
          isCorrect: grade.deterministic ? grade.isCorrect : null,
          timeSpentSeconds: Math.max(0, Math.round(input.metadata?.timeSpentSeconds ?? 0)),
          revisions: Math.max(0, Math.round(input.metadata?.revisions ?? 0)),
          metadata: input.metadata ?? {},
          updatedAt: new Date(),
        },
      });
    saved += 1;
  }

  await db
    .update(assessmentAttempts)
    .set({ currentSectionKey: sectionKey, updatedAt: new Date() })
    .where(eq(assessmentAttempts.id, attemptId));

  return { saved };
}

export interface SubmitSectionInput {
  sectionKey: string;
  content?: Record<string, unknown>;
  files?: { fileName: string; contentType: string; size: number; url?: string }[];
  aiUsage?: Record<string, unknown>;
}

export async function submitSection(
  attemptId: number,
  userId: number,
  input: SubmitSectionInput,
): Promise<void> {
  const db = await getDb();
  const attempt = await getOwnedAttempt(attemptId, userId);

  const [section] = await db
    .select()
    .from(assessmentSections)
    .where(
      and(
        eq(assessmentSections.blueprintId, attempt.blueprintId),
        eq(assessmentSections.key, input.sectionKey),
      ),
    )
    .limit(1);
  if (!section) throw new ApiError("NOT_FOUND", "Section not found.");

  await db
    .insert(assessmentSubmissions)
    .values({
      attemptId,
      sectionId: section.id,
      content: input.content ?? {},
      files: input.files ?? [],
      aiUsage: input.aiUsage ?? {},
    })
    .onConflictDoUpdate({
      target: [assessmentSubmissions.attemptId, assessmentSubmissions.sectionId],
      set: {
        content: input.content ?? {},
        files: input.files ?? [],
        aiUsage: input.aiUsage ?? {},
        submittedAt: new Date(),
      },
    });
}

/** Finalise the working sections and move the attempt into evaluation. */
export async function submitAttempt(
  attemptId: number,
  userId: number,
  totalTimeSeconds: number,
): Promise<void> {
  const db = await getDb();
  const attempt = await getOwnedAttempt(attemptId, userId);

  if (attempt.status !== "in_progress") {
    throw new ApiError("ATTEMPT_ALREADY_SUBMITTED", "This attempt has already been submitted.");
  }

  await db
    .update(assessmentAttempts)
    .set({
      status: "submitted",
      submittedAt: new Date(),
      timeSpentSeconds: Math.max(0, Math.round(totalTimeSeconds)),
      updatedAt: new Date(),
    })
    .where(eq(assessmentAttempts.id, attemptId));

  await recordEvent({
    type: "assessment.submitted",
    userId,
    attemptId,
    payload: { timeSpentSeconds: totalTimeSeconds },
  });
}

export async function getAttemptResponses(attemptId: number) {
  const db = await getDb();
  return db
    .select({
      response: assessmentResponses,
      item: assessmentItems,
      section: assessmentSections,
    })
    .from(assessmentResponses)
    .innerJoin(assessmentItems, eq(assessmentItems.id, assessmentResponses.itemId))
    .innerJoin(assessmentSections, eq(assessmentSections.id, assessmentItems.sectionId))
    .where(eq(assessmentResponses.attemptId, attemptId));
}

export async function getAttemptSubmissions(attemptId: number) {
  const db = await getDb();
  return db
    .select({ submission: assessmentSubmissions, section: assessmentSections })
    .from(assessmentSubmissions)
    .innerJoin(assessmentSections, eq(assessmentSections.id, assessmentSubmissions.sectionId))
    .where(eq(assessmentSubmissions.attemptId, attemptId));
}

export async function getRubricsForBlueprint(blueprintId: number) {
  const db = await getDb();
  return db
    .select()
    .from(assessmentRubrics)
    .where(eq(assessmentRubrics.blueprintId, blueprintId));
}

export async function getDefenseQuestions(attemptId: number) {
  const db = await getDb();
  return db
    .select()
    .from(assessmentDefenseQuestions)
    .where(eq(assessmentDefenseQuestions.attemptId, attemptId))
    .orderBy(assessmentDefenseQuestions.order);
}

export async function getDefenseResponses(attemptId: number) {
  const db = await getDb();
  return db
    .select()
    .from(assessmentDefenseResponses)
    .where(eq(assessmentDefenseResponses.attemptId, attemptId));
}

export async function listUserAttempts(userId: number) {
  const db = await getDb();
  return db
    .select({
      attempt: assessmentAttempts,
      blueprint: assessmentBlueprints,
    })
    .from(assessmentAttempts)
    .innerJoin(
      assessmentBlueprints,
      eq(assessmentBlueprints.id, assessmentAttempts.blueprintId),
    )
    .where(eq(assessmentAttempts.userId, userId))
    .orderBy(desc(assessmentAttempts.startedAt));
}
