import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./member-home-runtime-controller.tsx', import.meta.url), 'utf8');

test('desktop tournament remains visible when mock or runtime data exists', () => {
  const visibilityContract = 'runtime.features.tournament || runtime.homeData.tournaments.length > 0';

  assert.ok(source.includes(visibilityContract));
  assert.ok(source.includes('setVisible(\'[data-section-kind="tournament"]\', enabled)'));
  assert.ok(source.includes('syncTournamentBoards('));
  assert.ok(source.includes('slide.hidden = !enabled || !tournament'));
});
