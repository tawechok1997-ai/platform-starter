'use client';

import MobileProviderGamesCategoryPage, {
  type MobileProviderGamesCard,
} from './mobile-provider-games-category-page';

const FISHING_PROVIDERS: readonly MobileProviderGamesCard[] = [
  { code: 'ygrfish', name: 'YGR Fishing', source: 'https://cdn.zabbet.com/providers/set/1_1_h/ygrfish.png', layout: 'wide-hero', badge: 'hot' },
  { code: 'misoltfish', name: 'MISO Fishing', source: 'https://cdn.zabbet.com/providers/set/1_1_l/misoltfish.png', layout: 'wide-banner' },
  { code: 'cqfish', name: 'CQ9 Fishing', source: 'https://cdn.zabbet.com/providers/set/1_1_h/cqfish.png', layout: 'half' },
  { code: 'fachaifish', name: 'Fa Chai Fishing', source: 'https://cdn.zabbet.com/providers/set/1_1_h/fachaifish.png', layout: 'half' },
  { code: 'jlfish', name: 'JILI Fishing', source: 'https://cdn.zabbet.com/providers/set/1_1_h/jlfish.png', layout: 'half' },
  { code: 'jkgx2fish', name: 'Joker Fishing', source: 'https://cdn.zabbet.com/providers/set/1_1_h/jkgx2fish.png', layout: 'half' },
  { code: 'rsgfish', name: 'RSG Fishing', source: 'https://cdn.zabbet.com/providers/set/1_1_h/rsgfish.png', layout: 'half' },
  { code: 'sppfish', name: 'SimplePlay Fishing', source: 'https://cdn.zabbet.com/providers/set/1_1_h/sppfish.png', layout: 'half' },
  { code: 'spgfish', name: 'Spadegaming Fishing', source: 'https://cdn.zabbet.com/providers/set/1_1_h/spgfish.png', layout: 'half' },
  { code: 'wmfish', name: 'WM Fishing', source: 'https://cdn.zabbet.com/providers/set/1_1_h/wmfish.png', layout: 'half' },
  { code: 'kagafish', name: 'KA Gaming Fishing', source: 'https://cdn.zabbet.com/providers/set/1_1_h/kagafish.png', layout: 'half' },
  { code: 'r88fish', name: 'Rich88 Fishing', source: 'https://cdn.zabbet.com/providers/set/1_1_h/r88fish.png', layout: 'half' },
  { code: 'fsfish', name: 'FastSpin Fishing', source: 'https://cdn.zabbet.com/providers/set/1_1_h/fsfish.png', layout: 'half' },
  { code: 'askfish', name: 'AskMeSlot Fishing', source: 'https://cdn.zabbet.com/providers/set/1_1_h/askfish.png', layout: 'half' },
  { code: 'acewinfish', name: 'AceWin Fishing', source: 'https://cdn.zabbet.com/providers/set/1_1_h/acewinfish.png', layout: 'half', badge: 'new' },
] as const;

export default function MobileFishingProviderPage() {
  return (
    <MobileProviderGamesCategoryPage
      category="fishing"
      catalogSlug="fishing"
      title={{ th: 'ตกปลา', en: 'Fishing' }}
      providers={FISHING_PROVIDERS}
      catalogPlatform="mobile"
      providerAssetPlatform="mobile"
      gameAssetPlatform="pc"
    />
  );
}
