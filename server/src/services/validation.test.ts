import assert from 'node:assert/strict';
import test from 'node:test';

import { sanitizeModelResponse, validateTotalPassageTextLength } from './validation.js';

test('validateTotalPassageTextLength rejects oversized scripture context', () => {
  assert.equal(validateTotalPassageTextLength([
    { text: 'x'.repeat(6001) },
  ]), false);
  assert.equal(validateTotalPassageTextLength([
    { text: 'x'.repeat(3000) },
    { text: 'y'.repeat(2999) },
  ]), true);
});

test('sanitizeModelResponse removes references not supplied by the client', () => {
  const sanitized = sanitizeModelResponse({
    summary: 'A compassionate summary for the user.',
    scriptures: [
      { reference: 'JAS.1.19-20', reason: 'This supplied passage speaks directly to slowness and anger.' },
      { reference: 'REV.999.200', reason: 'This one should not be allowed through.' },
    ],
    context: 'This is enough context for the response to pass validation.',
    application: 'This is enough application for the response to pass validation.',
    reflectionQuestions: ['What might it look like to slow down before responding?'],
    prayer: 'Lord, help me respond with patience and humility today.',
    nextStep: 'Pause before the next hard conversation and name one gentle response.',
    safetyNote: '',
  }, ['JAS.1.19-20']);

  assert.deepEqual(sanitized.scriptures.map((scripture) => scripture.reference), ['JAS.1.19-20']);
});
