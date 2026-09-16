import { serverConfig } from '../config.js';
import type { AskScriptureRequest, ModelAskScriptureResponse } from '../schemas/askScripture.js';
import { modelResponseSchema } from '../schemas/askScripture.js';

export function validateTotalPassageTextLength(request: AskScriptureRequest) {
  const total = request.passages.reduce((sum, passage) => sum + passage.text.length, 0);
  return total <= serverConfig.limits.maxTotalPassageTextLength;
}

export function sanitizeModelResponse(
  raw: unknown,
  allowedReferences: string[],
): ModelAskScriptureResponse {
  const parsed = modelResponseSchema.parse(raw);
  const allowed = new Set(allowedReferences.map((reference) => reference.toUpperCase()));
  const scriptures = parsed.scriptures.filter((scripture) => allowed.has(scripture.reference.toUpperCase()));

  if (!scriptures.length) {
    throw new Error('Model response did not include any supplied Scripture references.');
  }

  return {
    ...parsed,
    scriptures,
  };
}
