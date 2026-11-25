import { serverConfig } from '../config.js';
import type { AskEntitlement } from './askPolicy.js';

const cache = new Map<string, number>();
const pendingLookups = new Map<string, Promise<AskEntitlement>>();

function parseEntitlement(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') return null;
  const subscriber = (payload as { subscriber?: { entitlements?: Record<string, { expires_date?: string | null }> } }).subscriber;
  const entitlement = subscriber?.entitlements?.[serverConfig.revenueCat.entitlementId];
  if (!entitlement) return null;

  // A null expires_date means a lifetime/non-expiring entitlement.
  if (entitlement.expires_date === null) return Infinity;
  const expiresAt = Date.parse(entitlement.expires_date ?? '');
  return Number.isFinite(expiresAt) && expiresAt > Date.now() ? expiresAt : null;
}

async function fetchEntitlementFromRevenueCat(subscriberId: string): Promise<number | null> {
  const { apiKey, apiUrl, requestTimeoutMs } = serverConfig.revenueCat;

  const response = await fetch(`${apiUrl}/subscribers/${encodeURIComponent(subscriberId)}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  if (!response.ok) throw new Error('RevenueCat is unavailable.');
  return parseEntitlement(await response.json());
}

async function updateEntitlement(subscriberId: string): Promise<AskEntitlement> {
  const paidThrough = await fetchEntitlementFromRevenueCat(subscriberId);
  if (paidThrough === null) {
    // A purchase can transition from free to Plus at any time, including on another API replica.
    cache.delete(subscriberId);
    return 'free';
  }
  cache.set(subscriberId, Math.min(paidThrough, Date.now() + serverConfig.revenueCat.cacheTtlMs));
  if (cache.size > 10_000) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  return 'plus';
}

export async function resolveEntitlement(subscriberId: string, refresh = false): Promise<AskEntitlement> {
  if (!serverConfig.revenueCat.apiKey) return 'free';

  const cached = cache.get(subscriberId) ?? 0;
  if (!refresh && cached > Date.now()) return 'plus';

  let lookup = pendingLookups.get(subscriberId);
  if (!lookup) {
    lookup = updateEntitlement(subscriberId).finally(() => pendingLookups.delete(subscriberId));
    pendingLookups.set(subscriberId, lookup);
  }
  try {
    return await lookup;
  } catch (error) {
    if (cached > Date.now()) return 'plus';
    if (refresh) throw error;
    return 'free';
  }
}
