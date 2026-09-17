import { randomUUID } from 'node:crypto';

import pg from 'pg';

import { serverConfig } from '../config.js';
import { getAskPolicy } from './askPolicy.js';

const { Pool } = pg;

export type UsageBucketType = 'client' | 'ip' | 'global';

export type UsageSnapshot = {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
};

export type ReservationResult =
  | { ok: true; reservationId: string }
  | { ok: false; status: number; code: string; message: string; limit?: number; usage?: UsageSnapshot };

export interface UsageStore {
  initialize(): Promise<void>;
  getClientUsage(input: { clientId: string; dateKey: string; resetsAt: string }): Promise<UsageSnapshot>;
  reserveAsk(input: { clientId: string; ipHash: string; dateKey: string; resetsAt: string }): Promise<ReservationResult>;
  commitReservation(reservationId: string): Promise<UsageSnapshot>;
  releaseReservation(reservationId: string): Promise<void>;
}

type BucketKey = `${UsageBucketType}:${string}:${string}`;
type Bucket = { askCount: number; activeCount: number; lastSeenAt: Date };
type MemoryReservation = { clientKey: BucketKey; ipKey: BucketKey; globalKey: BucketKey; dateKey: string; resetsAt: string };

function snapshot(used: number, limit: number, resetsAt: string): UsageSnapshot {
  return { limit, used, remaining: Math.max(limit - used, 0), resetsAt };
}

export class MemoryUsageStore implements UsageStore {
  private buckets = new Map<BucketKey, Bucket>();
  private reservations = new Map<string, MemoryReservation>();

  async initialize() {}

  private key(type: UsageBucketType, bucketKey: string, dateKey: string): BucketKey {
    return `${type}:${bucketKey}:${dateKey}`;
  }

  private getBucket(key: BucketKey) {
    const existing = this.buckets.get(key);
    if (existing) return existing;
    const created = { askCount: 0, activeCount: 0, lastSeenAt: new Date() };
    this.buckets.set(key, created);
    return created;
  }

  async getClientUsage(input: { clientId: string; dateKey: string; resetsAt: string }) {
    const policy = getAskPolicy('free');
    const bucket = this.getBucket(this.key('client', input.clientId, input.dateKey));
    return snapshot(bucket.askCount, policy.freeAsksPerDay, input.resetsAt);
  }

  async reserveAsk(input: { clientId: string; ipHash: string; dateKey: string; resetsAt: string }): Promise<ReservationResult> {
    const policy = getAskPolicy('free');
    const clientKey = this.key('client', input.clientId, input.dateKey);
    const ipKey = this.key('ip', input.ipHash, input.dateKey);
    const globalKey = this.key('global', 'ask-scripture', input.dateKey);
    const client = this.getBucket(clientKey);
    const ip = this.getBucket(ipKey);
    const global = this.getBucket(globalKey);

    if (client.activeCount > 0) return { ok: false, status: 429, code: 'ASK_ALREADY_IN_PROGRESS', message: 'Your previous question is still being prepared.' };
    if (client.askCount + client.activeCount >= policy.freeAsksPerDay) {
      return { ok: false, status: 429, code: 'DAILY_ASK_LIMIT', message: "You've used today's free Ask Scripture questions.", limit: policy.freeAsksPerDay, usage: snapshot(client.askCount, policy.freeAsksPerDay, input.resetsAt) };
    }
    if (ip.askCount + ip.activeCount >= policy.maxAsksPerIpPerDay) return { ok: false, status: 429, code: 'IP_DAILY_LIMIT', message: "Ask Scripture isn't available from this network right now. Please try again later." };
    if (global.askCount + global.activeCount >= policy.maxAiRequestsPerDay) return { ok: false, status: 503, code: 'AI_DAILY_CAP', message: 'Ask Scripture is temporarily unavailable. Please try again later.' };

    client.activeCount += 1;
    ip.activeCount += 1;
    global.activeCount += 1;
    const reservationId = randomUUID();
    this.reservations.set(reservationId, { clientKey, ipKey, globalKey, dateKey: input.dateKey, resetsAt: input.resetsAt });
    return { ok: true, reservationId };
  }

  async commitReservation(reservationId: string) {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) throw new Error('Unknown usage reservation.');
    for (const key of [reservation.clientKey, reservation.ipKey, reservation.globalKey]) {
      const bucket = this.getBucket(key);
      bucket.activeCount = Math.max(bucket.activeCount - 1, 0);
      bucket.askCount += 1;
      bucket.lastSeenAt = new Date();
    }
    this.reservations.delete(reservationId);
    const policy = getAskPolicy('free');
    const client = this.getBucket(reservation.clientKey);
    return snapshot(client.askCount, policy.freeAsksPerDay, reservation.resetsAt);
  }

  async releaseReservation(reservationId: string) {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) return;
    for (const key of [reservation.clientKey, reservation.ipKey, reservation.globalKey]) {
      const bucket = this.getBucket(key);
      bucket.activeCount = Math.max(bucket.activeCount - 1, 0);
      bucket.lastSeenAt = new Date();
    }
    this.reservations.delete(reservationId);
  }
}

export class PostgresUsageStore implements UsageStore {
  protected pool: pg.Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: serverConfig.nodeEnv === 'production' ? { rejectUnauthorized: false } : undefined,
    });
  }

  async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS anonymous_usage (
        bucket_type text NOT NULL,
        bucket_key text NOT NULL,
        date_key date NOT NULL,
        ask_count integer NOT NULL DEFAULT 0,
        active_count integer NOT NULL DEFAULT 0,
        last_seen_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (bucket_type, bucket_key, date_key)
      )
    `);
  }

  private async clearStaleReservations(client: pg.PoolClient) {
    await client.query(
      `UPDATE anonymous_usage
       SET active_count = 0
       WHERE active_count > 0 AND last_seen_at < now() - interval '5 minutes'`,
    );
  }

  private async ensureBucket(client: pg.PoolClient, type: UsageBucketType, key: string, dateKey: string) {
    await client.query(
      `INSERT INTO anonymous_usage (bucket_type, bucket_key, date_key, ask_count, active_count, last_seen_at)
       VALUES ($1, $2, $3, 0, 0, now())
       ON CONFLICT (bucket_type, bucket_key, date_key)
       DO UPDATE SET last_seen_at = now()`,
      [type, key, dateKey],
    );
  }

  private async getLockedBucket(client: pg.PoolClient, type: UsageBucketType, key: string, dateKey: string) {
    const result = await client.query<{ ask_count: number; active_count: number }>(
      `SELECT ask_count, active_count FROM anonymous_usage
       WHERE bucket_type = $1 AND bucket_key = $2 AND date_key = $3
       FOR UPDATE`,
      [type, key, dateKey],
    );
    const row = result.rows[0];
    return { askCount: Number(row?.ask_count ?? 0), activeCount: Number(row?.active_count ?? 0) };
  }

  async getClientUsage(input: { clientId: string; dateKey: string; resetsAt: string }) {
    const result = await this.pool.query<{ ask_count: number }>(
      `SELECT ask_count FROM anonymous_usage WHERE bucket_type = 'client' AND bucket_key = $1 AND date_key = $2`,
      [input.clientId, input.dateKey],
    );
    const used = Number(result.rows[0]?.ask_count ?? 0);
    return snapshot(used, getAskPolicy('free').freeAsksPerDay, input.resetsAt);
  }

  async reserveAsk(input: { clientId: string; ipHash: string; dateKey: string; resetsAt: string }): Promise<ReservationResult> {
    const policy = getAskPolicy('free');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await this.clearStaleReservations(client);
      await this.ensureBucket(client, 'client', input.clientId, input.dateKey);
      await this.ensureBucket(client, 'ip', input.ipHash, input.dateKey);
      await this.ensureBucket(client, 'global', 'ask-scripture', input.dateKey);

      const clientBucket = await this.getLockedBucket(client, 'client', input.clientId, input.dateKey);
      const ipBucket = await this.getLockedBucket(client, 'ip', input.ipHash, input.dateKey);
      const globalBucket = await this.getLockedBucket(client, 'global', 'ask-scripture', input.dateKey);

      let failure: ReservationResult | null = null;
      if (clientBucket.activeCount > 0) failure = { ok: false, status: 429, code: 'ASK_ALREADY_IN_PROGRESS', message: 'Your previous question is still being prepared.' };
      else if (clientBucket.askCount + clientBucket.activeCount >= policy.freeAsksPerDay) failure = { ok: false, status: 429, code: 'DAILY_ASK_LIMIT', message: "You've used today's free Ask Scripture questions.", limit: policy.freeAsksPerDay, usage: snapshot(clientBucket.askCount, policy.freeAsksPerDay, input.resetsAt) };
      else if (ipBucket.askCount + ipBucket.activeCount >= policy.maxAsksPerIpPerDay) failure = { ok: false, status: 429, code: 'IP_DAILY_LIMIT', message: "Ask Scripture isn't available from this network right now. Please try again later." };
      else if (globalBucket.askCount + globalBucket.activeCount >= policy.maxAiRequestsPerDay) failure = { ok: false, status: 503, code: 'AI_DAILY_CAP', message: 'Ask Scripture is temporarily unavailable. Please try again later.' };

      if (failure) {
        await client.query('COMMIT');
        return failure;
      }

      const reservationId = randomUUID();
      for (const [type, key] of [['client', input.clientId], ['ip', input.ipHash], ['global', 'ask-scripture']] as const) {
        await client.query(
          `UPDATE anonymous_usage SET active_count = active_count + 1, last_seen_at = now()
           WHERE bucket_type = $1 AND bucket_key = $2 AND date_key = $3`,
          [type, key, input.dateKey],
        );
      }
      await client.query('COMMIT');
      return { ok: true, reservationId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async commitReservation(_reservationId: string): Promise<UsageSnapshot> {
    throw new Error('Postgres reservation commits require commitAskUsage.');
  }

  async releaseReservation(_reservationId: string) {
    throw new Error('Postgres reservation releases require releaseAskUsage.');
  }
}

class PostgresUsageReservationStore extends PostgresUsageStore {
  private reservations = new Map<string, { clientId: string; ipHash: string; dateKey: string; resetsAt: string }>();

  override async reserveAsk(input: { clientId: string; ipHash: string; dateKey: string; resetsAt: string }) {
    const result = await super.reserveAsk(input);
    if (result.ok) this.reservations.set(result.reservationId, input);
    return result;
  }

  override async commitReservation(reservationId: string) {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) throw new Error('Unknown usage reservation.');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const [type, key] of [['client', reservation.clientId], ['ip', reservation.ipHash], ['global', 'ask-scripture']] as const) {
        await client.query(
          `UPDATE anonymous_usage
           SET active_count = GREATEST(active_count - 1, 0), ask_count = ask_count + 1, last_seen_at = now()
           WHERE bucket_type = $1 AND bucket_key = $2 AND date_key = $3`,
          [type, key, reservation.dateKey],
        );
      }
      await client.query('COMMIT');
      this.reservations.delete(reservationId);
      return this.getClientUsage({ clientId: reservation.clientId, dateKey: reservation.dateKey, resetsAt: reservation.resetsAt });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  override async releaseReservation(reservationId: string) {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) return;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const [type, key] of [['client', reservation.clientId], ['ip', reservation.ipHash], ['global', 'ask-scripture']] as const) {
        await client.query(
          `UPDATE anonymous_usage
           SET active_count = GREATEST(active_count - 1, 0), last_seen_at = now()
           WHERE bucket_type = $1 AND bucket_key = $2 AND date_key = $3`,
          [type, key, reservation.dateKey],
        );
      }
      await client.query('COMMIT');
      this.reservations.delete(reservationId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

let usageStore: UsageStore | null = null;

export function getUsageStore() {
  if (!usageStore) {
    usageStore = serverConfig.databaseUrl ? new PostgresUsageReservationStore(serverConfig.databaseUrl) : new MemoryUsageStore();
  }
  return usageStore;
}

export function setUsageStoreForTests(store: UsageStore | null) {
  usageStore = store;
}

export async function initializeUsageStore() {
  await getUsageStore().initialize();
}
