import { AnthropicProvider } from "./providers/anthropic";
import { OpenAICompatibleProvider } from "./providers/openai-compatible";
import type { EvaluationProvider } from "./types";

/**
 * Resolve the configured AI provider, or null when none is configured.
 *
 * Supported out of the box:
 *   - Google Gemini (free tier friendly) via its OpenAI-compatible endpoint
 *   - OpenAI-compatible endpoints (OpenAI, Groq, Together, OpenRouter, local)
 *   - Anthropic
 *
 * When this returns null the platform must degrade honestly: deterministic
 * evaluation and the guided mentor still run, and the UI says AI is unavailable.
 * It must NEVER fabricate an AI result.
 */
export function getEvaluationProvider(): EvaluationProvider | null {
  const configured = process.env.AI_PROVIDER?.toLowerCase();
  const geminiKey =
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GOOGLE_API_KEY;

  if (configured === "gemini" || (!configured && geminiKey)) {
    if (!geminiKey) return null;
    return new OpenAICompatibleProvider({
      name: "gemini",
      apiKey: geminiKey,
      baseUrl: process.env.AI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai",
      model: process.env.AI_MODEL ?? "gemini-2.0-flash",
    });
  }

  if (
    (configured === "anthropic" || (!configured && process.env.ANTHROPIC_API_KEY)) &&
    process.env.ANTHROPIC_API_KEY
  ) {
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

/** Human-readable provider label for settings/debug UI. Never includes the key. */
export function aiProviderLabel(): string | null {
  return getEvaluationProvider()?.name ?? null;
}

export const AI_UNAVAILABLE_MESSAGE =
  "Automated AI evaluation is currently unavailable. Your submission has been saved and scored using deterministic checks only.";

export type { EvaluationProvider } from "./types";
