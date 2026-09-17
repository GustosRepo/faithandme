import assert from 'node:assert/strict';
import test from 'node:test';

import { CLIENT_ID_HEADER, getClientIdFromRequest } from './clientIdentity.js';

function requestWithHeader(value: string | undefined) {
  return {
    header(name: string) {
      return name.toLowerCase() === CLIENT_ID_HEADER ? value : undefined;
    },
  };
}

test('getClientIdFromRequest accepts a valid UUID', () => {
  const clientId = getClientIdFromRequest(requestWithHeader('550e8400-e29b-41d4-a716-446655440000') as never);
  assert.equal(clientId, '550e8400-e29b-41d4-a716-446655440000');
});

test('getClientIdFromRequest rejects malformed IDs', () => {
  const clientId = getClientIdFromRequest(requestWithHeader('not-a-real-client-id') as never);
  assert.equal(clientId, null);
});
