import { serverConfig } from '../config.js';

export type AskEntitlement = 'free' | 'plus';

export type AskPolicy = {
  entitlement: AskEntitlement;
  asksPerDay: number;
  maxAsksPerIpPerDay: number;
  maxAiRequestsPerDay: number;
  /** Paying members are never blocked by shared-network (church, dorm) IP buckets. */
  bypassIpLimit: boolean;
};

export function getAskPolicy(entitlement: AskEntitlement = 'free'): AskPolicy {
  const isPlus = entitlement === 'plus';
  return {
    entitlement,
    asksPerDay: isPlus ? serverConfig.limits.plusAsksPerDay : serverConfig.limits.freeAsksPerDay,
    maxAsksPerIpPerDay: serverConfig.limits.maxAsksPerIpPerDay,
    maxAiRequestsPerDay: serverConfig.limits.maxAiRequestsPerDay,
    bypassIpLimit: isPlus,
  };
}

export function getUtcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getNextUtcReset(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1)).toISOString();
}
