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

export class AnthropicProvider implements EvaluationProvider {
  readonly name = "anthropic";
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: { apiKey: string; model: string; baseUrl?: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = (config.baseUrl ?? "https://api.anthropic.com/v1").replace(/\/$/, "");
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  private async complete(system: string, user: string): Promise<ProviderResult<string>> {
    if (!this.isConfigured()) {
      return { ok: false, reason: "AI provider is not configured.", code: "NOT_CONFIGURED" };
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60_000);
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2048,
          temperature: 0.2,
          system,
          messages: [{ role: "user", content: user }],
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
      const body = (await response.json()) as { content?: { text?: string }[] };
      const content = body.content?.map((c) => c.text ?? "").join("").trim();
      if (!content) {
        return { ok: false, reason: "Provider returned an empty response.", code: "INVALID_OUTPUT" };
      }
      return { ok: true, data: content, provider: this.name, model: this.model };
    } catch {
      return { ok: false, reason: "Could not reach the AI provider.", code: "PROVIDER_ERROR" };
    }
  }

  async evaluateSubmission(task: EvaluationTask): Promise<ProviderResult<StructuredEvaluation>> {
    const raw = await this.complete(EVALUATOR_SYSTEM_PROMPT, buildEvaluationPrompt(task));
    if (!raw.ok) return raw;
    try {
      return {
        ok: true,
        data: structuredEvaluationSchema.parse(parseJsonObject(raw.data)),
        provider: this.name,
        model: this.model,
      };
    } catch {
      return { ok: false, reason: "AI response failed schema validation.", code: "INVALID_OUTPUT" };
    }
  }

  async generateDefenseQuestions(
    request: DefenseQuestionRequest,
  ): Promise<ProviderResult<GeneratedDefenseQuestion[]>> {
    const raw = await this.complete(EVALUATOR_SYSTEM_PROMPT, buildDefenseQuestionPrompt(request));
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
      return { ok: false, reason: "AI response failed schema validation.", code: "INVALID_OUTPUT" };
    }
  }

  async evaluateDefense(
    request: DefenseEvaluationRequest,
  ): Promise<ProviderResult<DefenseEvaluation>> {
    const raw = await this.complete(EVALUATOR_SYSTEM_PROMPT, buildDefenseEvaluationPrompt(request));
    if (!raw.ok) return raw;
    try {
      return {
        ok: true,
        data: defenseEvaluationSchema.parse(parseJsonObject(raw.data)),
        provider: this.name,
        model: this.model,
      };
    } catch {
      return { ok: false, reason: "AI response failed schema validation.", code: "INVALID_OUTPUT" };
    }
  }

  async chat(request: ChatRequest): Promise<ProviderResult<string>> {
    const transcript = request.messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");
    return this.complete(request.system, transcript);
  }
}
