// Run with: npm test   (Node built-in runner, no extra dependencies)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePC,
  calculateCotePratique,
  calculateDifference,
  roundMm,
  getConformity,
  checkReading,
  checkDifference,
} from '../calculations.ts';

test('P.C. = ALT + lecture arrière', () => {
  assert.equal(roundMm(calculatePC(100.25, 1.5)), 101.75);
});

test('cote pratique = P.C. - lecture avant', () => {
  assert.equal(roundMm(calculateCotePratique(101.75, 1.2)), 100.55);
});

test('difference sign: >0 remblai, <0 déblai', () => {
  assert.ok(calculateDifference(100.6, 100.55) > 0);
  assert.ok(calculateDifference(100.5, 100.55) < 0);
});

test('negative readings are supported in arithmetic', () => {
  assert.equal(roundMm(calculateCotePratique(10, -0.5)), 10.5);
});

test('roundMm rounds to 3 decimals', () => {
  assert.equal(roundMm(0.1 + 0.2), 0.3);
  assert.equal(roundMm(1.23456), 1.235);
});

test('conformity at the tolerance boundary (float-safe)', () => {
  assert.equal(getConformity(0.02), 'ok');
  assert.equal(getConformity(-0.02), 'ok');
  assert.equal(getConformity(0.021), 'out');
  assert.equal(getConformity(0.03, 0.05), 'ok');
  assert.equal(getConformity(0.1 + 0.2 - 0.28), 'ok'); // ~0.02000000000000002
});

test('reading sanity checks', () => {
  assert.equal(checkReading(null), null);
  assert.equal(checkReading(1.53), null);
  assert.ok(checkReading(-1));
  assert.ok(checkReading(15.3));
});

test('difference sanity check', () => {
  assert.equal(checkDifference(null), null);
  assert.equal(checkDifference(0.4), null);
  assert.ok(checkDifference(-0.8));
});
