import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HOME_GAME_SETTINGS_KEY,
  defaultHomeGameSelectionConfig,
  homeGameReference,
  selectHomeGameSection,
  type HomeGameSelectionCandidate,
} from './home-game-selection';

const catalog: HomeGameSelectionCandidate[] = [
  game('ordinary', 'Ordinary Slot', 120, ['slot']),
  game('sweet', 'Sweet Bonanza', 800, ['slot', 'popular'], true),
  game('gates', 'Gates of Olympus', 500, ['slot', 'hot'], true),
  game('roulette', 'European Roulette', 320, ['table', 'classic']),
  game('online', 'Busy Game', 9_000, ['slot']),
];

test('automatic popular selection prioritizes researched popular names that exist in the API catalog', () => {
  const selected = selectHomeGameSection(catalog, 'popular', 'pc', {}, 3, () => 0.5);
  assert.deepEqual(selected.map((item) => item.id), ['gates', 'sweet', 'online']);
});

test('online selection uses actual player counts before random fallback order', () => {
  const selected = selectHomeGameSection(catalog, 'online', 'mobile', {}, 3, () => 0.5);
  assert.deepEqual(selected.map((item) => item.id), ['online', 'sweet', 'gates']);
});

test('manual selection keeps configured platform order', () => {
  const config = defaultHomeGameSelectionConfig();
  config.sections.featured.mode = 'manual';
  config.sections.featured.pc = [homeGameReference(catalog[1]!), homeGameReference(catalog[2]!)];
  config.sections.featured.mobile = [homeGameReference(catalog[2]!)];
  const features = { [HOME_GAME_SETTINGS_KEY]: JSON.stringify(config) };

  assert.deepEqual(
    selectHomeGameSection(catalog, 'featured', 'pc', features, 8, () => 0.5).map((item) => item.id),
    ['sweet', 'gates'],
  );
  assert.deepEqual(
    selectHomeGameSection(catalog, 'featured', 'mobile', features, 8, () => 0.5).map((item) => item.id),
    ['gates'],
  );
});

test('hybrid selection pins configured games before automatic fill', () => {
  const config = defaultHomeGameSelectionConfig();
  config.sections.classic.mode = 'hybrid';
  config.sections.classic.pc = [homeGameReference(catalog[0]!)];
  const features = { [HOME_GAME_SETTINGS_KEY]: JSON.stringify(config) };
  const selected = selectHomeGameSection(catalog, 'classic', 'pc', features, 3, () => 0.5);

  assert.equal(selected[0]?.id, 'ordinary');
  assert.ok(selected.some((item) => item.id === 'roulette'));
});

function game(
  id: string,
  name: string,
  players: number,
  tags: string[],
  popular = false,
): HomeGameSelectionCandidate {
  return {
    id,
    providerGameCode: id,
    provider: 'provider',
    name,
    category: tags[0] ?? 'slot',
    tags,
    players,
    popular,
  };
}
