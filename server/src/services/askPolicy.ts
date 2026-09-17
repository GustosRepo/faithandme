import { serverConfig } from '../config.js';

export type AskEntitlement = 'free';

export type AskPolicy = {
  entitlement: AskEntitlement;
  freeAsksPerDay: number;
  maxAsksPerIpPerDay: number;
  maxAiRequestsPerDay: number;
};

export function getAskPolicy(_entitlement: AskEntitlement = 'free'): AskPolicy {
  return {
    entitlement: 'free',
    freeAsksPerDay: serverConfig.limits.freeAsksPerDay,
    maxAsksPerIpPerDay: serverConfig.limits.maxAsksPerIpPerDay,
    maxAiRequestsPerDay: serverConfig.limits.maxAiRequestsPerDay,
  };
}

export function getUtcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getNextUtcReset(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1)).toISOString();
}
