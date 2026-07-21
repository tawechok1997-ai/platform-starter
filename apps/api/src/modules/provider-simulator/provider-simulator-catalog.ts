import { PC_GAME_CATALOG } from './provider-simulator-pc-catalog.generated';

export type SimulatorGamePlatform = 'mobile' | 'desktop' | 'both';
type SimulatorCatalogPlatform = SimulatorGamePlatform | 'pc';

export type SimulatorGameCatalogItem = {
  code: string;
  name: string;
  provider: string;
  platform: SimulatorCatalogPlatform;
  category: string;
  accent: string;
  symbol: string;
  assetPath?: string;
  providerLogoPath?: string;
};

export type SimulatorMediaContract = {
  imageUrl: string;
  iconUrl: string;
  fallbackIconUrl: string;
  providerLogoUrl: string | null;
  source: 'repository' | 'generated-placeholder';
  placeholder: boolean;
};

export const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  cq: 'CQ9 Gaming',
  evp: 'Evolution Play',
  fachai: 'Fa Chai Gaming',
  kingm: 'Kingmaker',
  nlc: 'NoLimit City',
  pgsoft: 'PG Soft',
  pp: 'Pragmatic Play',
};

const MOBILE_GAME_CATALOG: readonly SimulatorGameCatalogItem[] = [
  {
    code: 'thai-hi-lo-2',
    name: 'Thai Hi-Lo 2',
    provider: 'kingm',
    platform: 'mobile',
    category: 'casino',
    accent: '#f59e0b',
    symbol: 'HL',
    assetPath: 'asset/catalog/mobile/games/kingmaker/thai-hi-lo-2.jpg',
    providerLogoPath: 'asset/catalog/mobile/providers/kingmaker.png',
  },
  {
    code: 'bushido-ways',
    name: 'Bushido Ways',
    provider: 'nlc',
    platform: 'mobile',
    category: 'slot',
    accent: '#dc2626',
    symbol: '武',
    assetPath: 'asset/catalog/mobile/games/nolimit-city/bushido-ways.jpg',
    providerLogoPath: 'asset/catalog/mobile/providers/nolimit-city.png',
  },
  {
    code: 'el-paso',
    name: 'El Paso',
    provider: 'nlc',
    platform: 'mobile',
    category: 'slot',
    accent: '#b45309',
    symbol: 'EP',
    assetPath: 'asset/catalog/mobile/games/nolimit-city/el-paso.jpg',
    providerLogoPath: 'asset/catalog/mobile/providers/nolimit-city.png',
  },
  {
    code: 'alice-run',
    name: 'Alice Run',
    provider: 'cq',
    platform: 'mobile',
    category: 'arcade',
    accent: '#0ea5e9',
    symbol: 'AR',
    assetPath: 'asset/catalog/mobile/games/cq9/alice-run.jpg',
    providerLogoPath: 'asset/catalog/mobile/providers/cq9.png',
  },
  {
    code: 'penalty-series',
    name: 'Penalty Series',
    provider: 'evp',
    platform: 'mobile',
    category: 'sport',
    accent: '#16a34a',
    symbol: 'PS',
    assetPath: 'asset/catalog/mobile/games/evolution-play/penalty-series.jpg',
    providerLogoPath: 'asset/catalog/mobile/providers/evolution-play.png',
  },
  {
    code: 'sweet-bonanza-xmas',
    name: 'Sweet Bonanza Xmas',
    provider: 'pp',
    platform: 'mobile',
    category: 'slot',
    accent: '#db2777',
    symbol: 'SB',
    assetPath: 'asset/catalog/mobile/games/pragmatic-play/sweet-bonanza-xmas.png',
    providerLogoPath: 'asset/catalog/mobile/providers/pragmatic-play.png',
  },
  {
    code: 'fachai-27001',
    name: 'Fa Chai 27001',
    provider: 'fachai',
    platform: 'mobile',
    category: 'slot',
    accent: '#eab308',
    symbol: '發',
    assetPath: 'asset/catalog/mobile/games/fa-chai/fachai-27001.jpg',
    providerLogoPath: 'asset/catalog/mobile/providers/fa-chai.png',
  },
];

export const GAME_CATALOG: readonly SimulatorGameCatalogItem[] = [
  ...MOBILE_GAME_CATALOG,
  ...PC_GAME_CATALOG,
];

export function normalizeSimulatorPlatform(platform: SimulatorCatalogPlatform): SimulatorGamePlatform {
  return platform === 'pc' ? 'desktop' : platform;
}

export function platformMatches(gamePlatform: SimulatorCatalogPlatform, requested?: SimulatorGamePlatform) {
  if (!requested) return true;
  const normalized = normalizeSimulatorPlatform(gamePlatform);
  return normalized === 'both' || requested === 'both' || normalized === requested;
}

export function buildSimulatorMediaContract(
  game: Pick<SimulatorGameCatalogItem, 'code' | 'assetPath' | 'providerLogoPath'>,
  publicBaseUrl: string,
): SimulatorMediaContract {
  const baseUrl = publicBaseUrl.replace(/\/$/, '');
  const repositoryImage = assetUrl(game.assetPath, baseUrl);
  const providerLogoUrl = assetUrl(game.providerLogoPath, baseUrl);
  const fallbackIconUrl = `${baseUrl}/provider-simulator/icons/${game.code}.svg`;
  return {
    imageUrl: repositoryImage ?? fallbackIconUrl,
    iconUrl: repositoryImage ?? fallbackIconUrl,
    fallbackIconUrl,
    providerLogoUrl,
    source: repositoryImage ? 'repository' : 'generated-placeholder',
    placeholder: !repositoryImage,
  };
}

export function assetUrl(path: string | undefined, _publicBaseUrl: string) {
  if (!path) return null;
  const configured = process.env.GAME_ASSET_BASE_URL?.replace(/\/$/, '');
  if (configured) return `${configured}/${path}`;
  const repository = process.env.GITHUB_REPOSITORY ?? 'tawechok1997-ai/platform-starter';
  const ref = process.env.GAME_ASSET_GIT_REF ?? 'main';
  return `https://raw.githubusercontent.com/${repository}/${ref}/${path}`;
}
