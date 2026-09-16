import { z } from 'zod';

import { serverConfig } from '../config.js';

export const passageSchema = z.strictObject({
  reference: z.string().trim().regex(/^[1-3]?[A-Z]{2,3}\.\d+\.\d+(?:-\d+)?$/),
  displayReference: z.string().trim().min(3).max(80),
  text: z.string().trim().min(1).max(serverConfig.limits.maxPassageTextLength),
});

export const askScriptureRequestSchema = z.strictObject({
  question: z.string().trim().min(serverConfig.limits.questionMinLength).max(serverConfig.limits.questionMaxLength),
  passages: z.array(passageSchema).min(1).max(serverConfig.limits.maxPassages),
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
export type ModelAskScriptureResponse = z.infer<typeof modelResponseSchema>;
