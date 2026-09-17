import { randomUUID } from 'node:crypto';

import { Router } from 'express';
import { ZodError } from 'zod';

import { serverConfig } from '../config.js';
import { askScriptureRequestSchema } from '../schemas/askScripture.js';
import { createAskScriptureResponse } from '../services/openai.js';
import { classifySafety } from '../services/safety.js';
import { validateTotalPassageTextLength } from '../services/validation.js';

export const askScriptureRouter = Router();

function getSafeErrorInfo(error: unknown) {
  if (error && typeof error === 'object') {
    const maybeError = error as { name?: unknown; message?: unknown; status?: unknown; code?: unknown; type?: unknown };
    return {
      name: typeof maybeError.name === 'string' ? maybeError.name : 'Error',
      status: typeof maybeError.status === 'number' ? maybeError.status : undefined,
      code: typeof maybeError.code === 'string' ? maybeError.code : undefined,
      type: typeof maybeError.type === 'string' ? maybeError.type : undefined,
      message: typeof maybeError.message === 'string' ? maybeError.message.slice(0, 300) : 'Unknown error',
    };
  }

  return { name: 'Error', message: 'Unknown error' };
}

askScriptureRouter.post('/ask-scripture', async (req, res) => {
  const requestId = randomUUID();
  const startedAt = Date.now();

  try {
    const parsed = askScriptureRequestSchema.parse(req.body);

    if (!validateTotalPassageTextLength(parsed)) {
      res.status(413).json({ error: { code: 'payload_too_large', message: 'Too much Scripture context was provided.' } });
      return;
    }

    if (!serverConfig.openAiApiKey) {
      res.status(503).json({ error: { code: 'service_unavailable', message: 'Something went wrong while preparing your response.' } });
      return;
    }

    const safetyLevel = classifySafety(parsed.question);
    const answer = await createAskScriptureResponse(parsed, safetyLevel);

    res.json({
      requestId,
      answer,
      safetyLevel,
    });

    console.info(JSON.stringify({ requestId, endpoint: 'ask-scripture', status: 200, latencyMs: Date.now() - startedAt }));
  } catch (error) {
    const latencyMs = Date.now() - startedAt;

    if (error instanceof ZodError) {
      console.info(JSON.stringify({ requestId, endpoint: 'ask-scripture', status: 400, latencyMs, error: 'validation' }));
      res.status(400).json({ error: { code: 'invalid_request', message: 'Add a little more detail so we can find relevant Scripture.' } });
      return;
    }

    console.error(JSON.stringify({ requestId, endpoint: 'ask-scripture', status: 500, latencyMs, error: 'server', detail: getSafeErrorInfo(error) }));
    res.status(500).json({ error: { code: 'server_error', message: 'Something went wrong while preparing your response.' } });
  }
});
