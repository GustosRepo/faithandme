import { z } from 'zod';

import { serverConfig } from '../config.js';

export const passageSchema = z.strictObject({
  reference: z.string().trim().regex(/^[1-3]?[A-Z]{2,3}\.\d+\.\d+(?:-\d+)?$/),
  // Legacy fields: accepted for backwards compatibility but ignored. The server
  // resolves canonical passage text from the reference and never trusts client text.
  displayReference: z.string().trim().min(3).max(80).optional(),
  text: z.string().trim().min(1).max(serverConfig.limits.maxPassageTextLength).optional(),
});

export const askContextSchema = z.strictObject({
  goals: z.array(z.string().trim().min(1).max(60)).max(3).optional(),
  situations: z.array(z.string().trim().min(1).max(60)).max(3).optional(),
  feeling: z.string().trim().min(1).max(40).optional(),
});

export const askScriptureRequestSchema = z.strictObject({
  question: z.string().trim().min(serverConfig.limits.questionMinLength).max(serverConfig.limits.questionMaxLength),
  language: z.enum(['en', 'es']).default('en'),
  passages: z.array(passageSchema).min(1).max(serverConfig.limits.maxRequestPassages),
  context: askContextSchema.optional(),
  personalizationConsent: z.boolean().optional(),
});

export const modelScriptureSchema = z.strictObject({
  reference: z.string().trim().min(3).max(40),
  reason: z.string().trim().min(10).max(500),
});

export const modelResponseSchema = z.strictObject({
  summary: z.string().trim().min(10).max(500),
  scriptures: z.array(modelScriptureSchema).min(1).max(serverConfig.limits.maxPassages),
  context: z.string().trim().min(20).max(1200),
  application: z.string().trim().min(20).max(1200),
  reflectionQuestions: z.array(z.string().trim().min(8).max(240)).min(1).max(3),
  prayer: z.string().trim().min(10).max(900),
  nextStep: z.string().trim().min(10).max(500),
  safetyNote: z.string().trim().max(700),
});

export type AskScriptureRequest = z.infer<typeof askScriptureRequestSchema>;
export type AskContext = z.infer<typeof askContextSchema>;
export type ModelAskScriptureResponse = z.infer<typeof modelResponseSchema>;
