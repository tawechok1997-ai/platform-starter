import assert from 'node:assert/strict';
import test from 'node:test';

import {
  P8_PERSONAS,
  P8_TIER_0_ROUTES,
  buildP8Tier0Matrix,
  p8MatrixCaseKey,
  shardP8Matrix,
  validateP8Tier0Matrix,
} from './p8-release-matrix';

test('Tier 0 matrix covers every persona on desktop Chromium and focused responsive/cross-browser cases', () => {
  const matrix = buildP8Tier0Matrix();

  assert.equal(P8_TIER_0_ROUTES.length, 15);
  assert.equal(P8_PERSONAS.length, 7);
  assert.equal(matrix.length, 225);
  assert.deepEqual(validateP8Tier0Matrix(matrix), []);
  assert.equal(new Set(matrix.map(p8MatrixCaseKey)).size, matrix.length);
});

test('explicit deny cases remain explicit across every required surface', () => {
  const matrix = buildP8Tier0Matrix();
  const denyCases = matrix.filter((item) => item.persona === 'explicit-deny');

  assert.equal(denyCases.length, P8_TIER_0_ROUTES.length * 5);
  assert.equal(denyCases.every((item) => item.expectation === 'explicit-deny'), true);
});

test('matrix shards are deterministic, balanced, and reconstruct the full matrix without overlap', () => {
  const matrix = buildP8Tier0Matrix();
  const shards = Array.from({ length: 5 }, (_, index) => shardP8Matrix(matrix, index, 5));
  const reconstructed = shards.flat();

  assert.equal(shards.every((shard) => shard.length === 45), true);
  assert.equal(new Set(reconstructed.map(p8MatrixCaseKey)).size, matrix.length);
  assert.deepEqual(
    reconstructed.map(p8MatrixCaseKey).sort(),
    matrix.map(p8MatrixCaseKey).sort(),
  );
});

test('invalid shard requests fail closed', () => {
  const matrix = buildP8Tier0Matrix();

  assert.throws(() => shardP8Matrix(matrix, 0, 0), /positive integer/);
  assert.throws(() => shardP8Matrix(matrix, -1, 5), /within the shard range/);
  assert.throws(() => shardP8Matrix(matrix, 5, 5), /within the shard range/);
});
