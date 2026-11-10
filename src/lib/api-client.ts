/** Typed fetch helper for the consistent { success, data | error } envelope. */

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export class ApiClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiFetch<T>(
  input: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {};
  const response = await fetch(input, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(rest.headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  // Non-JSON responses (proxy 502/504 pages, empty 404s, gateway timeouts)
  // previously surfaced as a cryptic "unreadable response". Report the status.
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiClientError(
      response.status === 429 ? "RATE_LIMITED" : "INTERNAL_ERROR",
      response.ok
        ? "The server returned an unexpected response. Please try again."
        : `The request failed (HTTP ${response.status}). Please try again.`,
    );
  }

  let payload: ApiEnvelope<T>;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiClientError(
      "INTERNAL_ERROR",
      `The server returned an unreadable response (HTTP ${response.status}).`,
    );
  }

  if (!payload || typeof payload !== "object" || !("success" in payload)) {
    throw new ApiClientError(
      "INTERNAL_ERROR",
      `The server returned an unexpected response (HTTP ${response.status}).`,
    );
  }
  if (!payload.success) {
    throw new ApiClientError(payload.error.code, payload.error.message, payload.error.details);
  }
  return payload.data;
}
