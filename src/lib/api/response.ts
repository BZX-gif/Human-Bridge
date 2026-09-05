import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "DATABASE_UNAVAILABLE"
  | "ASSESSMENT_NOT_FOUND"
  | "ATTEMPT_NOT_FOUND"
  | "ATTEMPT_ALREADY_SUBMITTED"
  | "ATTEMPT_NOT_SUBMITTED"
  | "DEFENSE_NOT_READY"
  | "AI_UNAVAILABLE"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  DATABASE_UNAVAILABLE: 503,
  ASSESSMENT_NOT_FOUND: 404,
  ATTEMPT_NOT_FOUND: 404,
  ATTEMPT_ALREADY_SUBMITTED: 409,
  ATTEMPT_NOT_SUBMITTED: 409,
  DEFENSE_NOT_READY: 409,
  AI_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true as const, data }, { status });
}

export function fail(code: ApiErrorCode, message: string, details?: unknown) {
  return NextResponse.json(
    { success: false as const, error: { code, message, ...(details ? { details } : {}) } },
    { status: STATUS_BY_CODE[code] },
  );
}

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Wrap a route handler so internal errors never leak stack traces to users.
 */
export async function handleRoute<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.details);
    }
    if (error instanceof ZodError) {
      return fail("VALIDATION_ERROR", "Request body is invalid.", flattenZodError(error));
    }
    if (error instanceof Error && error.name === "DatabaseUnavailableError") {
      return fail(
        "DATABASE_UNAVAILABLE",
        "The database is not available. Set DATABASE_URL to enable this feature.",
      );
    }
    console.error("[api] unhandled error", error);
    return fail("INTERNAL_ERROR", "Something went wrong. Please try again.");
  }
}

function flattenZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}
