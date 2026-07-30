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

const TAG_ALIASES: Record<string, string> = {
  'เกมอาเขต': 'เกมส์อาเขต',
  'เกมส์อาเขต': 'เกมส์อาเขต',
  'ซื้อฟรีสปิน': 'ซื้อฟรีสปิน',
  'เกมฮิต': 'เกมส์ฮิต',
  'เกมส์ฮิต': 'เกมส์ฮิต',
  'เกมใหม่': 'เกมส์ใหม่',
  'เกมสใหม่': 'เกมส์ใหม่',
  'เกมส์ใหม่': 'เกมส์ใหม่',
  'เกมยล็อต': 'เกมส์สล็อต',
  'เกมสล็อต': 'เกมส์สล็อต',
  'เกมส์สล็อต': 'เกมส์สล็อต',
  'เกมโต๊ะ': 'เกมส์โต๊ะ',
  'เกมส์โต๊ะ': 'เกมส์โต๊ะ',
  '红黑大战': 'เกมส์โต๊ะ',
  'ไพ่': 'ไพ่',
  '-singaw': 'เกมส์ฮิต',
  'providername': 'เกมส์ฮิต',
  'ยิงปลา': 'เกมส์ฮิต',
};

const normalizeProviderCode = (provider: string) => provider
  .trim()
  .toLowerCase()
  .replace(/\.(?:png|jpe?g|webp|svg)$/i, '');

const normalizeCatalogTag = (tag: string) => TAG_ALIASES[tag.trim()] ?? tag.trim();

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

const catalogKey = (game: Pick<SimulatorGameCatalogItem, 'provider' | 'code' | 'platform'>) =>
  `${normalizeProviderCode(game.provider)}:${game.code}:${normalizeSimulatorPlatform(game.platform)}`;

function mergeCatalogs(
  ...catalogs: ReadonlyArray<readonly SimulatorGameCatalogItem[]>
): readonly SimulatorGameCatalogItem[] {
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

// Priority order matters: curated local assets win, recovered source data fills the
// complete lobby, and the historical generated lobby remains as a final safety net.
export const GAME_CATALOG: readonly SimulatorGameCatalogItem[] = mergeCatalogs(
  MOBILE_GAME_CATALOG,
  PC_GAME_CATALOG,
  RECOVERED_GAME_CATALOG_OVERLAY,
  LOBBY_GAME_CATALOG,
);

export function normalizeSimulatorPlatform(platform: SimulatorCatalogPlatform): SimulatorGamePlatform {
  return platform === 'pc' ? 'desktop' : platform;
}

export function platformMatches(gamePlatform: SimulatorCatalogPlatform, requested?: SimulatorCatalogPlatform) {
  if (!requested) return true;
  const normalizedGame = normalizeSimulatorPlatform(gamePlatform);
  const normalizedRequested = normalizeSimulatorPlatform(requested);
  return normalizedGame === 'both' || normalizedRequested === 'both' || normalizedGame === normalizedRequested;
}

export function buildSimulatorMediaContract(
  game: Pick<SimulatorGameCatalogItem, 'code' | 'assetPath' | 'providerLogoPath'>,
  publicBaseUrl: string,
): SimulatorMediaContract {
  const baseUrl = publicBaseUrl.replace(/\/$/, '');
  const imageUrl = assetUrl(game.assetPath, baseUrl);
  const providerLogoUrl = assetUrl(game.providerLogoPath, baseUrl);
  const fallbackIconUrl = `${baseUrl}/provider-simulator/icons/${game.code}.svg`;
  const source = imageUrl
    ? isAbsoluteHttpUrl(game.assetPath) ? 'source-cdn' : 'repository'
    : 'generated-placeholder';

  return {
    imageUrl: imageUrl ?? fallbackIconUrl,
    iconUrl: imageUrl ?? fallbackIconUrl,
    fallbackIconUrl,
    providerLogoUrl,
    source,
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
