import { createHmac } from 'node:crypto';

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

export function hashRequestIp(req: Request) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const secret = serverConfig.ipHashSecret;

  if (!secret) {
    throw new Error('IP_HASH_SECRET is not configured.');
  }

  return createHmac('sha256', secret).update(ip).digest('hex');
}
