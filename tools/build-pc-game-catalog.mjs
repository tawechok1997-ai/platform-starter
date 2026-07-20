import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'asset/catalog/pc/manifest.json');
const cardsPath = path.join(root, 'asset/catalog/pc/data/api.noproky.net/game-cards.json');
const jsonOutput = path.join(root, 'asset/catalog/pc/catalog.json');
const tsOutput = path.join(root, 'apps/api/src/modules/provider-simulator/provider-simulator-pc-catalog.generated.ts');

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const cardsPayload = JSON.parse(await readFile(cardsPath, 'utf8'));
const manifestItems = Array.isArray(manifest.items) ? manifest.items : [];
const cards = Array.isArray(cardsPayload.data) ? cardsPayload.data : [];

const byBasename = new Map();
for (const item of manifestItems) {
  if (!item || typeof item.repositoryPath !== 'string') continue;
  const base = path.posix.basename(item.repositoryPath).toLowerCase();
  const current = byBasename.get(base) ?? [];
  current.push(item.repositoryPath);
  byBasename.set(base, current);
}

const providerById = new Map();
for (const card of cards) {
  const provider = card?.providerDetail;
  if (!provider || !Number.isFinite(Number(provider.id))) continue;
  providerById.set(Number(provider.id), {
    id: Number(provider.id),
    code: normalizeProviderCode(provider.code || provider.name),
    name: cleanText(provider.name || card.name || provider.code),
    category: normalizeCategory(provider.game_type?.slug || provider.game_type?.name),
    imageCandidates: [card.image_v, card.image_h].filter(Boolean),
  });
}

const games = [];
for (const card of cards) {
  const cardCategory = normalizeCategory(card?.name);
  const details = Array.isArray(card?.gameCarDetail) ? card.gameCarDetail : [];
  for (const detail of details) {
    if (!detail || Number(detail.game_is_active) !== 1) continue;
    const providerId = Number(detail.game_provider_id);
    const provider = providerById.get(providerId) ?? {
      id: providerId,
      code: `provider-${providerId || 'unknown'}`,
      name: `Provider ${providerId || 'Unknown'}`,
      category: cardCategory,
      imageCandidates: [],
    };
    const name = firstDisplayName(detail.game_display_name) || cleanText(detail.game_name) || cleanText(detail.game_code);
    if (!name) continue;
    const code = slugify(detail.game_code || name || `game-${detail.game_id}`);
    const imageCandidates = [
      detail.image_v,
      firstCsvValue(detail.game_thumbnail_image_vertical),
      firstCsvValue(detail.game_thumbnail_image),
      detail.game_banner_image,
    ].filter(Boolean);
    const assetPath = resolveAsset(imageCandidates, 'games');
    const providerLogoPath = resolveProviderLogo(provider);
    games.push({
      code,
      name,
      provider: provider.code,
      providerName: provider.name,
      platform: 'pc',
      category: detail.game_is_fishing ? 'fishing' : detail.game_is_slot ? 'slot' : cardCategory || provider.category,
      accent: accentFor(provider.code),
      symbol: initials(name),
      assetPath,
      providerLogoPath,
      sourceId: Number(detail.game_id) || null,
      isHot: Number(detail.game_is_hot) === 1,
      isNew: Number(detail.game_is_new) === 1,
      sortOrder: Number(detail.game_sort_order) || 1000,
    });
  }
}

const deduped = [...new Map(games.map((game) => [`${game.provider}:${game.code}`, game])).values()]
  .sort((a, b) => Number(b.isHot) - Number(a.isHot) || Number(b.isNew) - Number(a.isNew) || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

const providers = [...new Map(deduped.map((game) => [game.provider, {
  code: game.provider,
  name: game.providerName,
  logoPath: game.providerLogoPath,
  gameCount: 0,
}])).values()];
for (const provider of providers) provider.gameCount = deduped.filter((game) => game.provider === provider.code).length;
providers.sort((a, b) => b.gameCount - a.gameCount || a.name.localeCompare(b.name));

const catalog = {
  generatedAt: new Date().toISOString(),
  platform: 'pc',
  counts: { games: deduped.length, providers: providers.length, gamesWithAssets: deduped.filter((game) => game.assetPath).length },
  providers,
  games: deduped,
};
await writeFile(jsonOutput, `${JSON.stringify(catalog, null, 2)}\n`);

const tsGames = deduped.map(({ providerName, sourceId, isHot, isNew, sortOrder, ...game }) => game);
const ts = `import type { SimulatorGameCatalogItem } from './provider-simulator-catalog';\n\nexport const PC_GAME_CATALOG: readonly SimulatorGameCatalogItem[] = ${JSON.stringify(tsGames, null, 2)} as const;\n`;
await writeFile(tsOutput, ts);
console.log(`Generated PC catalog: ${deduped.length} games, ${providers.length} providers, ${catalog.counts.gamesWithAssets} resolved images.`);

function resolveAsset(candidates, preferredCategory) {
  for (const candidate of candidates) {
    const base = path.posix.basename(String(candidate).split(',')[0].trim()).toLowerCase();
    if (!base) continue;
    const matches = byBasename.get(base) ?? [];
    const preferred = matches.find((entry) => entry.includes(`/pc/${preferredCategory}/`));
    if (preferred) return preferred;
    if (matches[0]) return matches[0];
  }
  return undefined;
}

function resolveProviderLogo(provider) {
  const direct = resolveAsset(provider.imageCandidates ?? [], 'providers');
  if (direct) return direct;
  const needles = [provider.code, slugify(provider.name)].filter(Boolean);
  return manifestItems.find((item) => item?.category === 'providers' && needles.some((needle) => String(item.repositoryPath).toLowerCase().includes(needle)))?.repositoryPath;
}

function firstCsvValue(value) {
  return String(value ?? '').split(',').map((part) => part.trim()).find(Boolean) || '';
}
function firstDisplayName(value) {
  return String(value ?? '').split(',').map(cleanText).find(Boolean) || '';
}
function cleanText(value) {
  return String(value ?? '').replace(/\[deletegame\]/ig, '').replace(/\s+/g, ' ').trim();
}
function normalizeProviderCode(value) {
  return slugify(value).replace(/-gaming$|-game$|-official$/g, '') || 'unknown';
}
function normalizeCategory(value) {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('fish') || text.includes('ยิงปลา')) return 'fishing';
  if (text.includes('sport') || text.includes('กีฬา')) return 'sport';
  if (text.includes('casino') || text.includes('บาคาร่า') || text.includes('ป็อก') || text.includes('ไพ่')) return 'casino';
  if (text.includes('slot') || text.includes('สล็อต')) return 'slot';
  if (text.includes('lotto') || text.includes('หวย')) return 'lottery';
  return 'arcade';
}
function slugify(value) {
  return String(value ?? '').normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}
function initials(value) {
  const words = String(value).match(/[A-Za-z0-9]+/g) ?? [];
  return (words.slice(0, 2).map((word) => word[0]).join('') || 'PC').toUpperCase();
}
function accentFor(value) {
  let hash = 0;
  for (const character of String(value)) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 72% 48%)`;
}
