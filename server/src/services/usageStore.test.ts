import assert from 'node:assert/strict';
import test from 'node:test';

import { serverConfig } from '../config.js';
import { getAskPolicy } from './askPolicy.js';
import { MemoryUsageStore } from './usageStore.js';

const originalPolicy = {
  freeAsksPerDay: serverConfig.limits.freeAsksPerDay,
  plusAsksPerDay: serverConfig.limits.plusAsksPerDay,
  maxAsksPerIpPerDay: serverConfig.limits.maxAsksPerIpPerDay,
  maxAiRequestsPerDay: serverConfig.limits.maxAiRequestsPerDay,
};

function setPolicy(values: Partial<typeof originalPolicy>) {
  Object.assign(serverConfig.limits as unknown as Record<string, number>, values);
}

test.beforeEach(() => {
  setPolicy({ ...originalPolicy, freeAsksPerDay: 3 });
});

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

test('plus entitlement has its own daily allowance', async () => {
  setPolicy({ freeAsksPerDay: 1, plusAsksPerDay: 20 });
  const store = new MemoryUsageStore();
  const plusPolicy = getAskPolicy('plus');

  const usage = await store.getClientUsage({ clientId: 'client-plus', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z', policy: plusPolicy });
  assert.equal(usage.limit, 20);

  const reservation = await store.reserveAsk({ clientId: 'client-plus', ipHash: 'ip-a', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z', policy: plusPolicy });
  assert.equal(reservation.ok, true);
  if (!reservation.ok) return;
  const committed = await store.commitReservation(reservation.reservationId);
  assert.equal(committed.limit, 20);
  assert.equal(committed.remaining, 19);

  const second = await store.reserveAsk({ clientId: 'client-plus', ipHash: 'ip-a', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z', policy: plusPolicy });
  assert.equal(second.ok, true);
});

test('plus entitlement bypasses the shared-network IP cap', async () => {
  setPolicy({ maxAsksPerIpPerDay: 1 });
  const store = new MemoryUsageStore();

  const free = await store.reserveAsk({ clientId: 'client-free', ipHash: 'ip-shared', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });
  assert.equal(free.ok, true);
  if (free.ok) await store.commitReservation(free.reservationId);

  const blockedFree = await store.reserveAsk({ clientId: 'client-free-2', ipHash: 'ip-shared', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z' });
  assert.equal(blockedFree.ok, false);
  if (!blockedFree.ok) assert.equal(blockedFree.code, 'IP_DAILY_LIMIT');

  const plus = await store.reserveAsk({ clientId: 'client-plus', ipHash: 'ip-shared', dateKey: '2026-09-17', resetsAt: '2026-09-18T00:00:00.000Z', policy: getAskPolicy('plus') });
  assert.equal(plus.ok, true);
});
