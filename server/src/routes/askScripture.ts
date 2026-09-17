import { randomUUID } from 'node:crypto';

import { Router, type Response } from 'express';
import { ZodError } from 'zod';

import { serverConfig } from '../config.js';
import { askScriptureRequestSchema } from '../schemas/askScripture.js';
import { getAskPolicy, getNextUtcReset, getUtcDateKey } from '../services/askPolicy.js';
import { getClientIdFromRequest, hashRequestIp } from '../services/clientIdentity.js';
import { createAskScriptureResponse } from '../services/openai.js';
import { classifySafety } from '../services/safety.js';
import { getUsageStore } from '../services/usageStore.js';
import { validateTotalPassageTextLength } from '../services/validation.js';

export const askScriptureRouter = Router();

function sendAppError(
  res: Response,
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>,
) {
  res.status(status).json({ error: { code, message, ...extra } });
}

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

askScriptureRouter.get('/ask-scripture/usage', async (req, res) => {
  try {
    const clientId = getClientIdFromRequest(req);
    if (!clientId) {
      sendAppError(res, 400, 'INVALID_CLIENT_ID', 'Ask Scripture needs a valid anonymous client ID.');
      return;
    }

    const dateKey = getUtcDateKey();
    const resetsAt = getNextUtcReset();
    const usage = await getUsageStore().getClientUsage({ clientId, dateKey, resetsAt });
    res.json({
      limit: usage.limit,
      used: usage.used,
      remaining: usage.remaining,
      resetsAt: usage.resetsAt,
    });
  } catch {
    sendAppError(res, 500, 'USAGE_UNAVAILABLE', 'Ask Scripture usage is temporarily unavailable.');
  }
});

askScriptureRouter.post('/ask-scripture', async (req, res) => {
  const requestId = randomUUID();
  const startedAt = Date.now();
  let reservationId: string | null = null;

  try {
    const clientId = getClientIdFromRequest(req);
    if (!clientId) {
      sendAppError(res, 400, 'INVALID_CLIENT_ID', 'Ask Scripture needs a valid anonymous client ID.');
      return;
    }

    const parsed = askScriptureRequestSchema.parse(req.body);

    if (!validateTotalPassageTextLength(parsed)) {
      res.status(413).json({ error: { code: 'payload_too_large', message: 'Too much Scripture context was provided.' } });
      return;
    }

    if (!serverConfig.askScriptureEnabled) {
      sendAppError(res, 503, 'ASK_SCRIPTURE_DISABLED', 'Ask Scripture is temporarily unavailable.');
      return;
    }

    if (!serverConfig.openAiApiKey) {
      res.status(503).json({ error: { code: 'service_unavailable', message: 'Something went wrong while preparing your response.' } });
      return;
    }

    const dateKey = getUtcDateKey();
    const resetsAt = getNextUtcReset();
    const ipHash = hashRequestIp(req);
    const reservation = await getUsageStore().reserveAsk({ clientId, ipHash, dateKey, resetsAt });
    if (!reservation.ok) {
      sendAppError(res, reservation.status, reservation.code, reservation.message, {
        limit: reservation.limit,
        usage: reservation.usage,
      });
      console.info(JSON.stringify({ requestId, endpoint: 'ask-scripture', status: reservation.status, latencyMs: Date.now() - startedAt, error: reservation.code }));
      return;
    }
    reservationId = reservation.reservationId;

    const safetyLevel = classifySafety(parsed.question);
    const { answer, tokenUsage } = await createAskScriptureResponse(parsed, safetyLevel);
    const usage = await getUsageStore().commitReservation(reservationId);
    reservationId = null;

    res.json({
      requestId,
      answer,
      safetyLevel,
      usage,
    });

    console.info(JSON.stringify({
      requestId,
      endpoint: 'ask-scripture',
      status: 200,
      latencyMs: Date.now() - startedAt,
      model: serverConfig.openAiModel,
      reasoningEffort: serverConfig.openAiReasoningEffort,
      tokenUsage,
    }));
  } catch (error) {
    const latencyMs = Date.now() - startedAt;

    if (error instanceof ZodError) {
      console.info(JSON.stringify({ requestId, endpoint: 'ask-scripture', status: 400, latencyMs, error: 'validation' }));
      res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Add a little more detail so we can find relevant Scripture.' } });
      return;
    }

    if (reservationId) {
      try {
        await getUsageStore().releaseReservation(reservationId);
      } catch {
        console.error(JSON.stringify({ requestId, endpoint: 'ask-scripture', status: 500, error: 'usage_release_failed' }));
      }
    }

    console.error(JSON.stringify({ requestId, endpoint: 'ask-scripture', status: 500, latencyMs, error: 'server', detail: getSafeErrorInfo(error) }));
    res.status(500).json({ error: { code: 'server_error', message: 'Something went wrong while preparing your response.' } });
  }
});
