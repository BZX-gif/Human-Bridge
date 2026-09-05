import { z } from "zod";

/**
 * Request schemas. Note what is ABSENT: there is no `score` field anywhere.
 * The client submits answers; the server decides everything else.
 */

export const responseValueSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("choice"), index: z.number().int().min(0).max(50) }),
  z.object({
    kind: z.literal("choices"),
    indexes: z.array(z.number().int().min(0).max(50)).max(50),
  }),
  z.object({ kind: z.literal("text"), text: z.string().max(50_000) }),
  z.object({ kind: z.literal("number"), value: z.number().finite() }),
  z.object({
    kind: z.literal("file"),
    fileName: z.string().max(255),
    contentType: z.string().max(120),
    size: z.number().int().min(0).max(10 * 1024 * 1024),
    excerpt: z.string().max(5000).optional(),
  }),
]);

export const responseMetadataSchema = z.object({
  timeSpentSeconds: z.number().min(0).max(86_400).optional(),
  pasteCount: z.number().int().min(0).max(10_000).optional(),
  pastedCharacters: z.number().int().min(0).max(1_000_000).optional(),
  focusLossCount: z.number().int().min(0).max(10_000).optional(),
  revisions: z.number().int().min(0).max(10_000).optional(),
});

export const startAttemptSchema = z.object({
  blueprint: z.string().min(1).max(150),
  jobId: z.number().int().positive().optional(),
});

export const saveResponsesSchema = z.object({
  attemptId: z.number().int().positive(),
  sectionKey: z.string().min(1).max(100),
  responses: z
    .array(
      z.object({
        itemKey: z.string().min(1).max(100),
        response: responseValueSchema,
        metadata: responseMetadataSchema.optional(),
      }),
    )
    .min(1)
    .max(100),
});

export const submitAttemptSchema = z.object({
  attemptId: z.number().int().positive(),
  totalTimeSeconds: z.number().min(0).max(86_400).default(0),
  sections: z
    .array(
      z.object({
        sectionKey: z.string().min(1).max(100),
        content: z.record(z.string(), z.unknown()).optional(),
        files: z
          .array(
            z.object({
              fileName: z.string().max(255),
              contentType: z.string().max(120),
              size: z.number().int().min(0),
              url: z.string().max(2000).optional(),
            }),
          )
          .max(10)
          .optional(),
        aiUsage: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .max(20)
    .optional(),
});

export const evaluateSchema = z.object({
  attemptId: z.number().int().positive(),
});

export const defenseAnswerSchema = z.object({
  attemptId: z.number().int().positive(),
  questionId: z.number().int().positive(),
  answer: z.string().min(1).max(20_000),
  timeSpentSeconds: z.number().min(0).max(86_400).optional(),
});

export const humanReviewSchema = z.object({
  evaluationId: z.number().int().positive(),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().min(1).max(5000),
});
