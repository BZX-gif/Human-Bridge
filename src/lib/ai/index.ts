import { AnthropicProvider } from "./providers/anthropic";
import { OpenAICompatibleProvider } from "./providers/openai-compatible";
import type { EvaluationProvider } from "./types";

/**
 * Resolve the configured AI provider, or null when none is configured.
 *
 * When this returns null the platform must degrade honestly: deterministic
 * evaluation still runs, and the UI says "AI evaluation unavailable".
 * It must NEVER fabricate an AI result.
 */
export function getEvaluationProvider(): EvaluationProvider | null {
  const configured = process.env.AI_PROVIDER?.toLowerCase();

  if ((configured === "anthropic" || (!configured && process.env.ANTHROPIC_API_KEY)) &&
      process.env.ANTHROPIC_API_KEY) {
    return new AnthropicProvider({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.AI_MODEL ?? "claude-sonnet-4-20250514",
      baseUrl: process.env.AI_BASE_URL,
    });
  }

  if (process.env.OPENAI_API_KEY) {
    return new OpenAICompatibleProvider({
      name: configured ?? "openai",
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
      model: process.env.AI_MODEL ?? "gpt-4o-mini",
    });
  }

  return null;
}

export function isAiConfigured(): boolean {
  return getEvaluationProvider() !== null;
}

export const AI_UNAVAILABLE_MESSAGE =
  "Automated AI evaluation is currently unavailable. Your submission has been saved and scored using deterministic checks only.";

export type { EvaluationProvider } from "./types";
