'use client';

import MobileProviderLauncherPage, {
  type MobileProviderLauncherCard,
} from './mobile-provider-launcher-page';

const LOTTERY_PROVIDERS: readonly MobileProviderLauncherCard[] = [
  {
    code: 'lotmw',
    name: 'LOTMW',
    source: 'https://cdn.zabbet.com/providers/set/1_1_h/lotmw.png',
    layout: 'wide-hero',
    isNew: true,
  },
  {
    code: 'dac',
    name: 'DAC',
    source: 'https://cdn.zabbet.com/providers/set/1_1_h/dac.png',
    layout: 'wide-hero',
  },
] as const;

export default function MobileLotteryProviderPage() {
  return (
    <MobileProviderLauncherPage
      category="lottery"
      title={{ th: 'หวย', en: 'Lottery' }}
      countLabel={{ th: 'เกม', en: 'games' }}
      providers={LOTTERY_PROVIDERS}
      stacked
      filterable
    />
  );
}
