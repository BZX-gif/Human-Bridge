import type {
  ChatRequest,
  DefenseEvaluation,
  DefenseEvaluationRequest,
  DefenseQuestionRequest,
  EvaluationProvider,
  EvaluationTask,
  GeneratedDefenseQuestion,
  ProviderResult,
  StructuredEvaluation,
} from "../types";
import {
  defenseEvaluationSchema,
  defenseQuestionsSchema,
  parseJsonObject,
  structuredEvaluationSchema,
} from "../schemas";
import {
  buildDefenseEvaluationPrompt,
  buildDefenseQuestionPrompt,
  buildEvaluationPrompt,
  EVALUATOR_SYSTEM_PROMPT,
} from "../prompts";

interface ProviderConfig {
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

/**
 * Works with any OpenAI-compatible /chat/completions endpoint (OpenAI, Groq,
 * Together, OpenRouter, local vLLM...). Anthropic is handled by its own adapter.
 */
export class OpenAICompatibleProvider implements EvaluationProvider {
  readonly name: string;
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: ProviderConfig) {
    this.name = config.name;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.model = config.model;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  private async complete(
    system: string,
    user: string,
    json: boolean,
  ): Promise<ProviderResult<string>> {
    if (!this.isConfigured()) {
      return { ok: false, reason: "AI provider is not configured.", code: "NOT_CONFIGURED" };
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60_000);
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.2,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          ...(json ? { response_format: { type: "json_object" } } : {}),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return {
          ok: false,
          reason: `Provider returned HTTP ${response.status}.`,
          code: "PROVIDER_ERROR",
        };
      }
      const body = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = body.choices?.[0]?.message?.content;
      if (!content) {
        return { ok: false, reason: "Provider returned an empty response.", code: "INVALID_OUTPUT" };
      }
      return { ok: true, data: content, provider: this.name, model: this.model };
    } catch {
      return { ok: false, reason: "Could not reach the AI provider.", code: "PROVIDER_ERROR" };
    }
  }

  async evaluateSubmission(task: EvaluationTask): Promise<ProviderResult<StructuredEvaluation>> {
    const raw = await this.complete(EVALUATOR_SYSTEM_PROMPT, buildEvaluationPrompt(task), true);
    if (!raw.ok) return raw;
    try {
      const parsed = structuredEvaluationSchema.parse(parseJsonObject(raw.data));
      return { ok: true, data: parsed, provider: this.name, model: this.model };
    } catch {
      return {
        ok: false,
        reason: "AI response did not match the required evaluation schema.",
        code: "INVALID_OUTPUT",
      };
    }
  }

  async generateDefenseQuestions(
    request: DefenseQuestionRequest,
  ): Promise<ProviderResult<GeneratedDefenseQuestion[]>> {
    const raw = await this.complete(
      EVALUATOR_SYSTEM_PROMPT,
      buildDefenseQuestionPrompt(request),
      true,
    );
    if (!raw.ok) return raw;
    try {
      const parsed = defenseQuestionsSchema.parse(parseJsonObject(raw.data));
      return {
        ok: true,
        data: parsed.questions.slice(0, request.maxQuestions),
        provider: this.name,
        model: this.model,
      };
    } catch {
      return {
        ok: false,
        reason: "AI response did not match the required defense-question schema.",
        code: "INVALID_OUTPUT",
      };
    }
  }

  async evaluateDefense(
    request: DefenseEvaluationRequest,
  ): Promise<ProviderResult<DefenseEvaluation>> {
    const raw = await this.complete(
      EVALUATOR_SYSTEM_PROMPT,
      buildDefenseEvaluationPrompt(request),
      true,
    );
    if (!raw.ok) return raw;
    try {
      const parsed = defenseEvaluationSchema.parse(parseJsonObject(raw.data));
      return { ok: true, data: parsed, provider: this.name, model: this.model };
    } catch {
      return {
        ok: false,
        reason: "AI response did not match the required defense-evaluation schema.",
        code: "INVALID_OUTPUT",
      };
    }
  }

  async chat(request: ChatRequest): Promise<ProviderResult<string>> {
    const transcript = request.messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");
    return this.complete(request.system, transcript, false);
  }
}
