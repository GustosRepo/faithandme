import { randomUUID } from 'node:crypto';

import { Router, type Response } from 'express';
import { ZodError } from 'zod';

import { serverConfig } from '../config.js';
import { askScriptureRequestSchema } from '../schemas/askScripture.js';
import { getAskPolicy, getNextUtcReset, getUtcDateKey } from '../services/askPolicy.js';
import { getCanonicalPassage, type CanonicalPassage } from '../services/bible.js';
import { getClientIdFromRequest, getVerifiedSubscriberId, hashRequestIp, issueAskSession } from '../services/clientIdentity.js';
import { resolveEntitlement } from '../services/entitlements.js';
import { createAskScriptureResponse, getReasoningEffortFor } from '../services/openai.js';
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
    const maybeError = error as { name?: unknown; status?: unknown; code?: unknown; type?: unknown };
    return {
      name: typeof maybeError.name === 'string' ? maybeError.name : 'Error',
      status: typeof maybeError.status === 'number' ? maybeError.status : undefined,
      code: typeof maybeError.code === 'string' ? maybeError.code : undefined,
      type: typeof maybeError.type === 'string' ? maybeError.type : undefined,
    };
  }

  return { name: 'Error' };
}

async function sendUsage(res: Response, clientId: string, subscriberId: string | null, refresh = false) {
  const entitlement = subscriberId ? await resolveEntitlement(subscriberId, refresh) : 'free';
  const policy = getAskPolicy(entitlement);
  const usage = await getUsageStore().getClientUsage({
    clientId, dateKey: getUtcDateKey(), resetsAt: getNextUtcReset(), policy,
  });
  res.set('Cache-Control', 'no-store').json({ ...usage, entitlement });
}

askScriptureRouter.post('/ask-scripture/session', (req, res) => {
  const clientId = getClientIdFromRequest(req);
  if (!clientId) {
    sendAppError(res, 400, 'INVALID_CLIENT_ID', 'Ask Scripture needs a valid anonymous client ID.');
    return;
  }
  const session = serverConfig.revenueCat.apiKey && issueAskSession(clientId);
  if (!session) {
    sendAppError(res, 503, 'PURCHASES_UNAVAILABLE', 'Ask Scripture purchases are temporarily unavailable.');
    return;
  }
  res.set('Cache-Control', 'no-store').status(201).json(session);
});

askScriptureRouter.post('/ask-scripture/entitlement', async (req, res) => {
  const clientId = getClientIdFromRequest(req);
  const subscriberId = clientId && getVerifiedSubscriberId(req, clientId);
  if (!clientId || !subscriberId) {
    sendAppError(res, 401, 'INVALID_SESSION', 'Ask Scripture needs a valid purchase session.');
    return;
  }
  try {
    await sendUsage(res, clientId, subscriberId, true);
  } catch {
    sendAppError(res, 503, 'USAGE_UNAVAILABLE', 'Ask Scripture usage is temporarily unavailable.');
  }
});

askScriptureRouter.get('/ask-scripture/usage', async (req, res) => {
  const clientId = getClientIdFromRequest(req);
  if (!clientId) {
    sendAppError(res, 400, 'INVALID_CLIENT_ID', 'Ask Scripture needs a valid anonymous client ID.');
    return;
  }
  const subscriberId = getVerifiedSubscriberId(req, clientId);
  if (req.header('authorization') && !subscriberId) {
    sendAppError(res, 401, 'INVALID_SESSION', 'Ask Scripture needs a valid purchase session.');
    return;
  }
  try {
    await sendUsage(res, clientId, subscriberId);
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
    const subscriberId = getVerifiedSubscriberId(req, clientId);
    if (req.header('authorization') && !subscriberId) {
      sendAppError(res, 401, 'INVALID_SESSION', 'Ask Scripture needs a valid purchase session.');
      return;
    }

    const parsed = askScriptureRequestSchema.parse(req.body);

    // Resolve canonical Scripture server-side; client-supplied passage text is never
    // trusted or forwarded to the model.
    const canonicalPassages: CanonicalPassage[] = [];
    const seenReferences = new Set<string>();
    for (const passage of parsed.passages) {
      const canonical = getCanonicalPassage(passage.reference, parsed.language);
      if (!canonical) {
        sendAppError(res, 400, 'INVALID_REQUEST', 'One of the Scripture references could not be found.');
        return;
      }
      if (seenReferences.has(canonical.reference)) continue;
      seenReferences.add(canonical.reference);
      canonicalPassages.push(canonical);
    }

    if (!validateTotalPassageTextLength(canonicalPassages)) {
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

    const entitlement = subscriberId ? await resolveEntitlement(subscriberId) : 'free';
    const policy = getAskPolicy(entitlement);
    const dateKey = getUtcDateKey();
    const resetsAt = getNextUtcReset();
    const ipHash = hashRequestIp(req);
    const reservation = await getUsageStore().reserveAsk({ clientId, ipHash, dateKey, resetsAt, policy });
    if (!reservation.ok) {
      sendAppError(res, reservation.status, reservation.code, reservation.message, {
        limit: reservation.limit,
        usage: reservation.usage,
        entitlement,
      });
      console.info(JSON.stringify({ requestId, endpoint: 'ask-scripture', status: reservation.status, latencyMs: Date.now() - startedAt, error: reservation.code }));
      return;
    }
    reservationId = reservation.reservationId;

    const safetyLevel = classifySafety(parsed.question);
    const { answer, tokenUsage } = await createAskScriptureResponse({
      question: parsed.question,
      language: parsed.language,
      passages: canonicalPassages,
      context: parsed.personalizationConsent === true ? parsed.context : undefined,
      safetyLevel,
      entitlement,
    });
    const usage = await getUsageStore().commitReservation(reservationId);
    reservationId = null;

    res.json({
      requestId,
      answer,
      safetyLevel,
      entitlement,
      usage: { ...usage, entitlement },
    });

    console.info(JSON.stringify({
      requestId,
      endpoint: 'ask-scripture',
      status: 200,
      latencyMs: Date.now() - startedAt,
      model: serverConfig.openAiModel,
      reasoningEffort: getReasoningEffortFor(entitlement),
      entitlement,
      language: parsed.language,
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
