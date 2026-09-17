import type { NextFunction, Request, Response } from 'express';

import { serverConfig } from '../config.js';

type Bucket = {
  resetAt: number;
  count: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const current = buckets.get(ip);

  if (!current || current.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + serverConfig.limits.rateLimitWindowMs });
    next();
    return;
  }

  if (current.count >= serverConfig.limits.rateLimitMaxRequests) {
    res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Please wait a moment before asking again.' } });
    return;
  }

  current.count += 1;
  next();
}
