import type { Game } from '../../types/member-api';

export type GamePlatform = 'mobile' | 'desktop' | 'universal';

export type GameCardModel = {
  id: string;
  code: string;
  name: string;
  providerName: string;
  providerCode: string;
  category: string;
  iconUrl: string;
  platform: GamePlatform;
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
};

export function buildGameCardModel(game: Game): GameCardModel | null {
  if (!game || typeof game.id !== 'string' || !game.id.trim()) return null;
  const name = cleanText(game.name, 100);
  const code = cleanText(game.providerGameCode, 80);
  if (!name || !code) return null;

  return {
    id: game.id.trim(),
    code,
    name,
    providerName: cleanText(game.provider?.name, 80),
    providerCode: cleanText(game.provider?.code, 40),
    category: cleanText(game.category, 40) || 'other',
    iconUrl: resolveGameIconUrl(game),
    platform: inferGamePlatform(game),
    isFeatured: Boolean(game.isFeatured),
    isNew: Boolean(game.isNew),
    isPopular: Boolean(game.isPopular),
  };
}

export function buildGameCardModels(games: Game[]) {
  const seen = new Set<string>();
  return games.flatMap((game) => {
    const model = buildGameCardModel(game);
    if (!model) return [];
    const key = `${model.providerCode}:${model.code}`.toLowerCase();
    if (seen.has(key)) return [];
    seen.add(key);
    return [model];
  });
}

export function resolveGameIconUrl(game: Game) {
  const media = Array.isArray(game.media) ? game.media : [];
  for (const item of media) {
    const cached = safeAssetUrl(item?.cachedUrl);
    if (cached) return cached;
    const source = safeAssetUrl(item?.sourceUrl);
    if (source) return source;
  }
  return '';
}

export function inferGamePlatform(game: Game): GamePlatform {
  const source = `${game.category} ${game.providerGameCode} ${game.media?.map((item) => item.type).join(' ')}`.toLowerCase();
  if (/mobile|android|ios|touch/.test(source)) return 'mobile';
  if (/desktop|pc|webgl/.test(source)) return 'desktop';
  return 'universal';
}

function safeAssetUrl(value: unknown) {
  if (typeof value !== 'string') return '';
  const candidate = value.trim();
  if (!candidate || candidate.length > 1000) return '';
  if (candidate.startsWith('/') && !candidate.startsWith('//') && !candidate.includes('\\')) return candidate;
  if (/^https:\/\//i.test(candidate)) return candidate;
  return '';
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}
