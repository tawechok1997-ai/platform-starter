'use client';

import MobileProviderGamesCategoryPage, {
  type MobileProviderGamesCard,
} from './mobile-provider-games-category-page';

const CARD_PROVIDER_SEEDS: readonly MobileProviderGamesCard[] = [
  {
    code: 'kingm',
    name: 'KINGMAKER',
    source: 'https://cdn.zabbet.com/providers/set/1_1_h/kingm.png',
    layout: 'wide-hero',
  },
  {
    code: 'amb',
    name: 'AMB',
    source: 'https://cdn.zabbet.com/providers/set/1_1_l/amb.png',
    layout: 'wide-banner',
  },
] as const;

export default function MobileCardProviderPage() {
  return (
    <MobileProviderGamesCategoryPage
      category="card"
      catalogSlug="card"
      title={{ th: 'ไพ่', en: 'Cards' }}
      providers={CARD_PROVIDER_SEEDS}
      catalogPlatform="mobile"
      providerAssetPlatform="mobile"
      gameAssetPlatform="pc"
      includeCatalogProviders
    />
  );
}
