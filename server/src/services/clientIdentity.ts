import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import type { Request } from 'express';

import { serverConfig } from '../config.js';

export const CLIENT_ID_HEADER = 'x-faith-client-id';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getClientIdFromRequest(req: Request) {
  const header = req.header(CLIENT_ID_HEADER);
  if (!header || header.length > 80 || !uuidPattern.test(header)) {
    return null;
  }
  return header.toLowerCase();
}

function signSession(clientId: string, subscriberId: string) {
  const secret = serverConfig.askSessionSecret;
  if (!secret) return null;
  return createHmac('sha256', secret)
    .update(`ask-scripture:v1:${clientId}:${subscriberId}`)
    .digest();
}

export function issueAskSession(clientId: string) {
  const subscriberId = randomUUID();
  const signature = signSession(clientId, subscriberId);
  if (!signature) return null;
  return { subscriberId, token: `${subscriberId}.${signature.toString('base64url')}` };
}

export function getVerifiedSubscriberId(req: Request, clientId: string) {
  const match = /^Bearer ([0-9a-f-]{36})\.([A-Za-z0-9_-]{43})$/i.exec(req.header('authorization') ?? '');
  const subscriberId = match?.[1];
  const receivedSignature = match?.[2];
  if (!subscriberId || !uuidPattern.test(subscriberId) || !receivedSignature) return null;

  const expected = signSession(clientId, subscriberId);
  const received = Buffer.from(receivedSignature, 'base64url');
  return expected && received.length === expected.length && timingSafeEqual(expected, received) ? subscriberId : null;
}

export function hashRequestIp(req: Request) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const secret = serverConfig.ipHashSecret;

  if (!secret) {
    throw new Error('IP_HASH_SECRET is not configured.');
  }

  return createHmac('sha256', secret).update(ip).digest('hex');
}
