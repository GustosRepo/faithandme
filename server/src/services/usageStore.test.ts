import assert from 'node:assert/strict';
import test from 'node:test';

import { serverConfig } from '../config.js';
import { MemoryUsageStore } from './usageStore.js';

const originalPolicy = {
  freeAsksPerDay: serverConfig.limits.freeAsksPerDay,
  maxAsksPerIpPerDay: serverConfig.limits.maxAsksPerIpPerDay,
  maxAiRequestsPerDay: serverConfig.limits.maxAiRequestsPerDay,
};

function setPolicy(values: Partial<typeof originalPolicy>) {
  Object.assign(serverConfig.limits as unknown as Record<string, number>, values);
}

test.afterEach(() => {
  setPolicy(originalPolicy);
});

test('new client starts with free daily allowance', async () => {
  const store = new MemoryUsageStore();
  const usage = await store.getClientUsage({ clientId: 'client-a', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });

  assert.equal(usage.limit, 3);
  assert.equal(usage.used, 0);
  assert.equal(usage.remaining, 3);
});

test('successful ask reduces remaining allowance', async () => {
  const store = new MemoryUsageStore();
  const reservation = await store.reserveAsk({ clientId: 'client-a', ipHash: 'ip-a', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });
  assert.equal(reservation.ok, true);
  if (!reservation.ok) return;

  const usage = await store.commitReservation(reservation.reservationId);
  assert.equal(usage.used, 1);
  assert.equal(usage.remaining, 2);
});

test('fourth ask is blocked before model work', async () => {
  const store = new MemoryUsageStore();

  for (let index = 0; index < 3; index += 1) {
    const reservation = await store.reserveAsk({ clientId: 'client-a', ipHash: 'ip-a', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });
    assert.equal(reservation.ok, true);
    if (reservation.ok) await store.commitReservation(reservation.reservationId);
  }

  const fourth = await store.reserveAsk({ clientId: 'client-a', ipHash: 'ip-a', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });
  assert.equal(fourth.ok, false);
  if (!fourth.ok) assert.equal(fourth.code, 'DAILY_ASK_LIMIT');
});

test('released reservation does not consume allowance', async () => {
  const store = new MemoryUsageStore();
  const reservation = await store.reserveAsk({ clientId: 'client-a', ipHash: 'ip-a', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });
  assert.equal(reservation.ok, true);
  if (reservation.ok) await store.releaseReservation(reservation.reservationId);

  const usage = await store.getClientUsage({ clientId: 'client-a', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });
  assert.equal(usage.used, 0);
  assert.equal(usage.remaining, 3);
});

test('same client next UTC day receives fresh allowance', async () => {
  const store = new MemoryUsageStore();
  const reservation = await store.reserveAsk({ clientId: 'client-a', ipHash: 'ip-a', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });
  assert.equal(reservation.ok, true);
  if (reservation.ok) await store.commitReservation(reservation.reservationId);

  const nextDay = await store.getClientUsage({ clientId: 'client-a', dateKey: '2026-09-18', resetsAt: '2026-09-19T00:00:00.000Z' });
  assert.equal(nextDay.used, 0);
  assert.equal(nextDay.remaining, 3);
});

test('different client IDs have independent allowances', async () => {
  const store = new MemoryUsageStore();
  const reservation = await store.reserveAsk({ clientId: 'client-a', ipHash: 'ip-a', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });
  assert.equal(reservation.ok, true);
  if (reservation.ok) await store.commitReservation(reservation.reservationId);

  const other = await store.getClientUsage({ clientId: 'client-b', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });
  assert.equal(other.used, 0);
  assert.equal(other.remaining, 3);
});

test('IP daily ceiling blocks excess requests from same network bucket', async () => {
  setPolicy({ maxAsksPerIpPerDay: 1 });
  const store = new MemoryUsageStore();
  const first = await store.reserveAsk({ clientId: 'client-a', ipHash: 'ip-a', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });
  assert.equal(first.ok, true);
  if (first.ok) await store.commitReservation(first.reservationId);

  const second = await store.reserveAsk({ clientId: 'client-b', ipHash: 'ip-a', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });
  assert.equal(second.ok, false);
  if (!second.ok) assert.equal(second.code, 'IP_DAILY_LIMIT');
});

test('global daily cap blocks model work', async () => {
  setPolicy({ maxAiRequestsPerDay: 1 });
  const store = new MemoryUsageStore();
  const first = await store.reserveAsk({ clientId: 'client-a', ipHash: 'ip-a', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });
  assert.equal(first.ok, true);
  if (first.ok) await store.commitReservation(first.reservationId);

  const second = await store.reserveAsk({ clientId: 'client-b', ipHash: 'ip-b', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });
  assert.equal(second.ok, false);
  if (!second.ok) assert.equal(second.code, 'AI_DAILY_CAP');
});

test('simultaneous requests from one client are blocked', async () => {
  const store = new MemoryUsageStore();
  const first = await store.reserveAsk({ clientId: 'client-a', ipHash: 'ip-a', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });
  assert.equal(first.ok, true);

  const second = await store.reserveAsk({ clientId: 'client-a', ipHash: 'ip-a', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });
  assert.equal(second.ok, false);
  if (!second.ok) assert.equal(second.code, 'ASK_ALREADY_IN_PROGRESS');
});
