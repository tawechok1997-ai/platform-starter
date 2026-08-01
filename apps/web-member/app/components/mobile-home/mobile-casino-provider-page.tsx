'use client';

import MobileProviderLauncherPage, {
  type MobileProviderLauncherCard,
} from './mobile-provider-launcher-page';

const CASINO_PROVIDERS: readonly MobileProviderLauncherCard[] = [
  {
    code: 'dg',
    name: 'Dream Gaming',
    source: 'https://cdn.zabbet.com/providers/set/1_1_h/dg.png',
    layout: 'wide-hero',
  },
  {
    code: 'sexyd',
    name: 'Sexy Baccarat',
    source: 'https://cdn.zabbet.com/providers/set/1_1_l/sexyd.png',
    layout: 'wide-banner',
  },
  {
    code: 'yeebet',
    name: 'YeeBet',
    source: 'https://cdn.zabbet.com/providers/set/1_1_h/yeebet.png',
    layout: 'half',
    isNew: true,
  },
  {
    code: 'sag',
    name: 'SA Gaming',
    source: 'https://cdn.zabbet.com/providers/set/1_1_h/sag.png',
    layout: 'half',
  },
  {
    code: 'ppcasino',
    name: 'Pragmatic Play Casino',
    source: 'https://cdn.zabbet.com/providers/set/1_1_h/ppcasino.png',
    layout: 'half',
  },
  {
    code: 'evt',
    name: 'Evolution',
    source: 'https://cdn.zabbet.com/providers/set/1_1_h/evt.png',
    layout: 'half',
  },
  {
    code: 'ab',
    name: 'AllBet',
    source: 'https://cdn.zabbet.com/providers/set/1_1_h/ab.png',
    layout: 'half',
  },
  {
    code: 'wmc',
    name: 'WM Casino',
    source: 'https://cdn.zabbet.com/providers/set/1_1_h/wmc.png',
    layout: 'half',
  },
  {
    code: 'biggamecasino',
    name: 'Big Gaming',
    source: 'https://cdn.zabbet.com/providers/set/1_1_h/biggamecasino.png',
    layout: 'half',
  },
  {
    code: 'astar',
    name: 'Astar',
    source: 'https://cdn.zabbet.com/providers/set/1_1_h/astar.png',
    layout: 'half',
    isNew: true,
  },
] as const;

export default function MobileCasinoProviderPage() {
  return (
    <MobileProviderLauncherPage
      category="casino"
      title={{ th: 'คาสิโน', en: 'Casino' }}
      providers={CASINO_PROVIDERS}
    />
  );
}
