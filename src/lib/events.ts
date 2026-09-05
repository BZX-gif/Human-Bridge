import { getDb } from "@/db";
import { domainEvents } from "@/db/schema";

export type DomainEventType =
  | "assessment.started"
  | "assessment.submitted"
  | "assessment.evaluated"
  | "assessment.completed"
  | "defense.generated"
  | "defense.answered"
  | "skill.verified"
  | "passport.updated"
  | "job.created"
  | "job.applied"
  | "candidate.shortlisted"
  | "candidate.hired";

export interface DomainEventInput {
  type: DomainEventType;
  userId?: number | null;
  attemptId?: number | null;
  jobId?: number | null;
  payload?: Record<string, unknown>;
}

/**
 * Append a domain event. Deliberately simple (a table, not a broker) — enough to
 * reconstruct the funnel and, later, correlate assessments with hiring outcomes.
 * Never throws into the caller's flow: telemetry must not break the product.
 */
export async function recordEvent(event: DomainEventInput): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(domainEvents).values({
      type: event.type,
      userId: event.userId ?? null,
      attemptId: event.attemptId ?? null,
      jobId: event.jobId ?? null,
      payload: event.payload ?? {},
    });
  } catch (error) {
    console.error("[events] failed to record", event.type, error);
  }
}
