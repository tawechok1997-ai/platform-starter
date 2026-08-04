import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./member-home-runtime-controller.tsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../member-home.tsx', import.meta.url), 'utf8');
const duplicateController = new URL('./member-game-section-runtime-controller.tsx', import.meta.url);

test('desktop tournament remains visible when mock or runtime data exists', () => {
  const visibilityContract = 'runtime.features.tournament || runtime.homeData.tournaments.length > 0';

  assert.ok(source.includes(visibilityContract));
  assert.ok(source.includes('setVisible(\'[data-section-kind="tournament"]\', enabled)'));
  assert.ok(source.includes('syncTournamentBoards('));
  assert.ok(source.includes('slide.hidden = !enabled || !tournament'));
});

test('one runtime owns game section visibility, limits and links', () => {
  assert.match(source, /const CARD_SELECTOR/);
  assert.match(source, /setVisible\(selector, section\.enabled\)/);
  assert.match(source, /const limit = isMobile \? section\.mobileLimit : section\.desktopLimit/);
  assert.match(source, /card\.dataset\.runtimeLimitHidden/);
  assert.match(source, /action\.href = section\.href/);
  assert.equal((source.match(/new MutationObserver/g) ?? []).length, 1);
});

test('duplicate game section controller is not mounted or kept on disk', () => {
  assert.doesNotMatch(home, /MemberGameSectionRuntimeController/);
  assert.equal(existsSync(duplicateController), false);
});
