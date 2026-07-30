import { LOBBY_GAME_CATALOG } from './provider-simulator-lobby-catalog.generated';
import { PC_GAME_CATALOG } from './provider-simulator-pc-catalog.generated';
import { RECOVERED_GAME_CATALOG_OVERLAY } from './provider-simulator-recovered-catalog.generated';

export type SimulatorGamePlatform = 'mobile' | 'desktop' | 'both';
export type SimulatorCatalogPlatform = SimulatorGamePlatform | 'pc';

export type SimulatorGameCatalogItem = {
  code: string;
  name: string;
  provider: string;
  platform: SimulatorCatalogPlatform;
  category: string;
  accent: string;
  symbol: string;
  tags?: readonly string[];
  assetPath?: string;
  providerLogoPath?: string;
};

export type SimulatorMediaContract = {
  imageUrl: string;
  iconUrl: string;
  fallbackIconUrl: string;
  providerLogoUrl: string | null;
  source: 'repository' | 'source-cdn' | 'generated-placeholder';
  placeholder: boolean;
};

export const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  acewin: 'AceWin',
  acewinfish: 'AceWin Fishing',
  amb: 'AMB',
  ame: 'AME',
  ap: 'Asia Play',
  ask: 'ASKME',
  askfish: 'ASKME Fishing',
  bng: 'BNG',
  cala: 'Cala',
  cq: 'CQ9 Gaming',
  cqfish: 'CQ9 Fishing',
  drag: 'Dragoon Soft',
  edp: 'EDP',
  evp: 'Evolution Play',
  fachai: 'Fa Chai Gaming',
  fachaifish: 'Fa Chai Fishing',
  fs: 'FastSpin',
  fsfish: 'FastSpin Fishing',
  glx: 'Galaxy',
  hacksaw: 'Hacksaw Gaming',
  hbn: 'Habanero',
  hotdog: 'Hot Dog',
  jkgx2: 'JDB',
  jkgx2fish: 'JDB Fishing',
  jl: 'Jili',
  jlfish: 'Jili Fishing',
  kaga: 'Ka Gaming',
  kagafish: 'Ka Gaming Fishing',
  kingm: 'Kingmaker',
  l22: 'Live22',
  misolt: 'Miso',
  misoltfish: 'Miso Fishing',
  n2: 'N2 Live',
  netent: 'NetEnt',
  nlc: 'NoLimit City',
  pgsoft: 'PG Soft',
  pgsus: 'PG Sus',
  pokslot: 'PokSlot',
  pp: 'Pragmatic Play',
  ps: 'PlayStar',
  r88: 'R88',
  r88fish: 'R88 Fishing',
  rb7slot: 'RB7 Slot',
  redtiger: 'Red Tiger',
  reg: 'Relax Gaming',
  rsg: 'RSG',
  rsgfish: 'RSG Fishing',
  spg: 'Spadegaming',
  spgfish: 'Spadegaming Fishing',
  spp: 'SimplePlay',
  sppfish: 'SimplePlay Fishing',
  vp: 'VPower',
  wmfish: 'WM Fishing',
  wmslot: 'WM Slot',
  ygg: 'Yggdrasil',
  ygr: 'YGR',
  ygrfish: 'YGR Fishing',
};

const MOBILE_GAME_CATALOG: readonly SimulatorGameCatalogItem[] = [
  { code: 'thai-hi-lo-2', name: 'Thai Hi-Lo 2', provider: 'kingm', platform: 'mobile', category: 'casino', accent: '#f59e0b', symbol: 'HL', assetPath: 'asset/catalog/mobile/games/kingmaker/thai-hi-lo-2.jpg', providerLogoPath: 'asset/catalog/mobile/providers/kingmaker.png' },
  { code: 'bushido-ways', name: 'Bushido Ways', provider: 'nlc', platform: 'mobile', category: 'slot', accent: '#dc2626', symbol: '武', assetPath: 'asset/catalog/mobile/games/nolimit-city/bushido-ways.jpg', providerLogoPath: 'asset/catalog/mobile/providers/nolimit-city.png' },
  { code: 'el-paso', name: 'El Paso', provider: 'nlc', platform: 'mobile', category: 'slot', accent: '#b45309', symbol: 'EP', assetPath: 'asset/catalog/mobile/games/nolimit-city/el-paso.jpg', providerLogoPath: 'asset/catalog/mobile/providers/nolimit-city.png' },
  { code: 'alice-run', name: 'Alice Run', provider: 'cq', platform: 'mobile', category: 'arcade', accent: '#0ea5e9', symbol: 'AR', assetPath: 'asset/catalog/mobile/games/cq9/alice-run.jpg', providerLogoPath: 'asset/catalog/mobile/providers/cq9.png' },
  { code: 'penalty-series', name: 'Penalty Series', provider: 'evp', platform: 'mobile', category: 'sport', accent: '#16a34a', symbol: 'PS', assetPath: 'asset/catalog/mobile/games/evolution-play/penalty-series.jpg', providerLogoPath: 'asset/catalog/mobile/providers/evolution-play.png' },
  { code: 'sweet-bonanza-xmas', name: 'Sweet Bonanza Xmas', provider: 'pp', platform: 'mobile', category: 'slot', accent: '#db2777', symbol: 'SB', assetPath: 'asset/catalog/mobile/games/pragmatic-play/sweet-bonanza-xmas.png', providerLogoPath: 'asset/catalog/mobile/providers/pragmatic-play.png' },
  { code: 'fachai-27001', name: 'Fa Chai 27001', provider: 'fachai', platform: 'mobile', category: 'slot', accent: '#eab308', symbol: '發', assetPath: 'asset/catalog/mobile/games/fa-chai/fachai-27001.jpg', providerLogoPath: 'asset/catalog/mobile/providers/fa-chai.png' },
];

export function normalizeSimulatorPlatform(platform: SimulatorCatalogPlatform): SimulatorGamePlatform {
  return platform === 'pc' ? 'desktop' : platform;
}

function normalizeProviderCode(provider: string) {
  return provider.trim().toLowerCase().replace(/\.(?:png|jpe?g|webp|svg)$/i, '');
}

function normalizeCatalogTag(tag: string) {
  const value = tag.trim();
  if (value === 'เกมอาเขต') return 'เกมส์อาเขต';
  if (value === 'เกมฮิต' || value === '-singaw' || value === 'ยิงปลา') return 'เกมส์ฮิต';
  if (value === 'เกมใหม่' || value === 'เกมสใหม่') return 'เกมส์ใหม่';
  if (value === 'เกมยล็อต' || value === 'เกมสล็อต') return 'เกมส์สล็อต';
  if (value === 'เกมโต๊ะ' || value === '红黑大战') return 'เกมส์โต๊ะ';
  return value;
}

function normalizeCatalogItem(game: SimulatorGameCatalogItem): SimulatorGameCatalogItem {
  const tags = game.tags
    ? Array.from(new Set(game.tags.map(normalizeCatalogTag).filter(Boolean)))
    : undefined;
  return {
    ...game,
    provider: normalizeProviderCode(game.provider),
    ...(tags?.length ? { tags } : {}),
  };
}

function catalogKey(game: Pick<SimulatorGameCatalogItem, 'provider' | 'code' | 'platform'>) {
  return `${normalizeProviderCode(game.provider)}:${game.code}:${normalizeSimulatorPlatform(game.platform)}`;
}

function mergeCatalogs(...catalogs: ReadonlyArray<readonly SimulatorGameCatalogItem[]>) {
  const merged = new Map<string, SimulatorGameCatalogItem>();
  for (const catalog of catalogs) {
    for (const sourceGame of catalog) {
      const game = normalizeCatalogItem(sourceGame);
      const key = catalogKey(game);
      if (!merged.has(key)) merged.set(key, game);
    }
  }
  return Array.from(merged.values());
}

// Curated repository assets win. Recovered source data fills missing and misclassified
// records. The historical generated lobby remains the final fallback.
export const GAME_CATALOG: readonly SimulatorGameCatalogItem[] = mergeCatalogs(
  MOBILE_GAME_CATALOG,
  PC_GAME_CATALOG,
  RECOVERED_GAME_CATALOG_OVERLAY,
  LOBBY_GAME_CATALOG,
);

export function platformMatches(gamePlatform: SimulatorCatalogPlatform, requested?: SimulatorCatalogPlatform) {
  if (!requested) return true;
  const game = normalizeSimulatorPlatform(gamePlatform);
  const filter = normalizeSimulatorPlatform(requested);
  return game === 'both' || filter === 'both' || game === filter;
}

export function buildSimulatorMediaContract(
  game: Pick<SimulatorGameCatalogItem, 'code' | 'assetPath' | 'providerLogoPath'>,
  publicBaseUrl: string,
): SimulatorMediaContract {
  const baseUrl = publicBaseUrl.replace(/\/$/, '');
  const imageUrl = assetUrl(game.assetPath, baseUrl);
  const providerLogoUrl = assetUrl(game.providerLogoPath, baseUrl);
  const fallbackIconUrl = `${baseUrl}/provider-simulator/icons/${game.code}.svg`;
  return {
    imageUrl: imageUrl ?? fallbackIconUrl,
    iconUrl: imageUrl ?? fallbackIconUrl,
    fallbackIconUrl,
    providerLogoUrl,
    source: imageUrl ? (isAbsoluteHttpUrl(game.assetPath) ? 'source-cdn' : 'repository') : 'generated-placeholder',
    placeholder: !imageUrl,
  };
}

export function assetUrl(path: string | undefined, _publicBaseUrl: string) {
  if (!path) return null;
  if (isAbsoluteHttpUrl(path)) return path;
  const configured = process.env.GAME_ASSET_BASE_URL?.replace(/\/$/, '');
  if (configured) return `${configured}/${path}`;
  const repository = process.env.GITHUB_REPOSITORY ?? 'tawechok1997-ai/platform-starter';
  const ref = process.env.GAME_ASSET_GIT_REF ?? 'main';
  return `https://raw.githubusercontent.com/${repository}/${ref}/${path}`;
}

function isAbsoluteHttpUrl(value: string | undefined): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}
