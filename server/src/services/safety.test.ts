import assert from 'node:assert/strict';
import test from 'node:test';

import { classifySafety } from './safety.js';

test('classifySafety flags immediate-danger wording', () => {
  assert.equal(classifySafety('I am suicidal and cannot stay safe tonight.'), 'immediate-danger');
});

test('classifySafety keeps ordinary spiritual questions standard', () => {
  assert.equal(classifySafety('I am anxious about work and need peace.'), 'standard');
});
