'use client';

import MobileProviderGamesCategoryPage, {
  type MobileProviderGamesCard,
} from './mobile-provider-games-category-page';

const SLOT_PROVIDERS: readonly MobileProviderGamesCard[] = [
  { code: 'ygr', name: 'YGR', source: 'https://cdn.zabbet.com/providers/set/1_1_h/ygr.png', layout: 'wide-hero', badge: 'hot' },
  { code: 'hotdog', name: 'HOTDOG', source: 'https://cdn.zabbet.com/providers/set/1_1_l/hotdog.png', layout: 'wide-banner', badge: 'new' },
  { code: 'misolt', name: 'MISOLT', source: 'https://cdn.zabbet.com/providers/set/1_1_h/misolt.png', layout: 'half' },
  { code: 'jl', name: 'JL', source: 'https://cdn.zabbet.com/providers/set/1_1_h/jl.png', layout: 'half', badge: 'hot' },
  { code: 'pp', name: 'PP', source: 'https://cdn.zabbet.com/providers/set/1_1_h/pp.png', layout: 'half' },
  { code: 'kingm', name: 'KINGM', source: 'https://cdn.zabbet.com/providers/set/1_1_h/kingm.png', layout: 'half' },
  { code: 'spg', name: 'SPG', source: 'https://cdn.zabbet.com/providers/set/1_1_h/spg.png', layout: 'half' },
  { code: 'jkgx2', name: 'JKGX2', source: 'https://cdn.zabbet.com/providers/set/1_1_h/jkgx2.png', layout: 'half' },
  { code: 'fachai', name: 'FACHAI', source: 'https://cdn.zabbet.com/providers/set/1_1_h/fachai.png', layout: 'half' },
  { code: 'rsg', name: 'RSG', source: 'https://cdn.zabbet.com/providers/set/1_1_h/rsg.png', layout: 'half' },
  { code: 'pgsoft', name: 'PGSOFT', source: 'https://cdn.zabbet.com/providers/set/1_1_h/pgsoft.png', layout: 'half' },
  { code: 'kaga', name: 'KAGA', source: 'https://cdn.zabbet.com/providers/set/1_1_h/kaga.png', layout: 'half' },
  { code: 'hacksaw', name: 'HACKSAW', source: 'https://cdn.zabbet.com/providers/set/1_1_h/hacksaw.png', layout: 'half', badge: 'new' },
  { code: 'cq', name: 'CQ', source: 'https://cdn.zabbet.com/providers/set/1_1_h/cq.png', layout: 'half' },
  { code: 'redtiger', name: 'REDTIGER', source: 'https://cdn.zabbet.com/providers/set/1_1_h/redtiger.png', layout: 'half' },
  { code: 'hbn', name: 'HBN', source: 'https://cdn.zabbet.com/providers/set/1_1_h/hbn.png', layout: 'half' },
  { code: 'wmslot', name: 'WMSLOT', source: 'https://cdn.zabbet.com/providers/set/1_1_h/wmslot.png', layout: 'half' },
  { code: 'evp', name: 'EVP', source: 'https://cdn.zabbet.com/providers/set/1_1_h/evp.png', layout: 'half' },
  { code: 'netent', name: 'NETENT', source: 'https://cdn.zabbet.com/providers/set/1_1_h/netent.png', layout: 'half' },
  { code: 'ps', name: 'PS', source: 'https://cdn.zabbet.com/providers/set/1_1_h/ps.png', layout: 'half' },
  { code: 'pokslot', name: 'POKSLOT', source: 'https://cdn.zabbet.com/providers/set/1_1_h/pokslot.png', layout: 'half' },
  { code: 'edp', name: 'EDP', source: 'https://cdn.zabbet.com/providers/set/1_1_h/edp.png', layout: 'half' },
  { code: 'spp', name: 'SPP', source: 'https://cdn.zabbet.com/providers/set/1_1_h/spp.png', layout: 'half' },
  { code: 'ame', name: 'AME', source: 'https://cdn.zabbet.com/providers/set/1_1_h/ame.png', layout: 'half' },
  { code: 'bng', name: 'BNG', source: 'https://cdn.zabbet.com/providers/set/1_1_h/bng.png', layout: 'half' },
  { code: 'r88', name: 'R88', source: 'https://cdn.zabbet.com/providers/set/1_1_h/r88.png', layout: 'half' },
  { code: 'cala', name: 'CALA', source: 'https://cdn.zabbet.com/providers/set/1_1_h/cala.png', layout: 'half' },
  { code: 'glx', name: 'GLX', source: 'https://cdn.zabbet.com/providers/set/1_1_h/glx.png', layout: 'half' },
  { code: 'l22', name: 'L22', source: 'https://cdn.zabbet.com/providers/set/1_1_h/l22.png', layout: 'half' },
  { code: 'reg', name: 'REG', source: 'https://cdn.zabbet.com/providers/set/1_1_h/reg.png', layout: 'half' },
  { code: 'ygg', name: 'YGG', source: 'https://cdn.zabbet.com/providers/set/1_1_h/ygg.png', layout: 'half' },
  { code: 'fs', name: 'FS', source: 'https://cdn.zabbet.com/providers/set/1_1_h/fs.png', layout: 'half' },
  { code: 'pgsus', name: 'PGSUS', source: 'https://cdn.zabbet.com/providers/set/1_1_h/pgsus.png', layout: 'half' },
  { code: 'n2', name: 'N2', source: 'https://cdn.zabbet.com/providers/set/1_1_h/n2.png', layout: 'half' },
  { code: 'ap', name: 'AP', source: 'https://cdn.zabbet.com/providers/set/1_1_h/ap.png', layout: 'half' },
  { code: 'amb', name: 'AMB', source: 'https://cdn.zabbet.com/providers/set/1_1_h/amb.png', layout: 'half' },
  { code: 'ask', name: 'ASK', source: 'https://cdn.zabbet.com/providers/set/1_1_h/ask.png', layout: 'half' },
  { code: 'nlc', name: 'NLC', source: 'https://cdn.zabbet.com/providers/set/1_1_h/nlc.png', layout: 'half' },
  { code: 'vp', name: 'VP', source: 'https://cdn.zabbet.com/providers/set/1_1_h/vp.png', layout: 'half', badge: 'new' },
  { code: 'drag', name: 'DRAG', source: 'https://cdn.zabbet.com/providers/set/1_1_h/drag.png', layout: 'half', badge: 'new' },
  { code: 'acewin', name: 'ACEWIN', source: 'https://cdn.zabbet.com/providers/set/1_1_h/acewin.png', layout: 'half', badge: 'new' },
  { code: 'rb7slot', name: 'RB7SLOT', source: 'https://cdn.zabbet.com/providers/set/1_1_h/rb7slot.png', layout: 'half', badge: 'new' },
] as const;

export default function MobileSlotProviderPage() {
  return (
    <MobileProviderGamesCategoryPage
      category="slot"
      catalogSlug="slot"
      title={{ th: 'สล็อต', en: 'Slots' }}
      providers={SLOT_PROVIDERS}
      catalogPlatform="mobile"
      providerAssetPlatform="mobile"
      gameAssetPlatform="pc"
      includeCatalogProviders
    />
  );
}
