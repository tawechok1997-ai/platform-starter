'use client';

import MobileProviderLauncherPage, {
  type MobileProviderLauncherCard,
} from './mobile-provider-launcher-page';

const SPORT_PROVIDERS: readonly MobileProviderLauncherCard[] = [
  {
    code: 'sbo',
    name: 'SBO',
    source: 'https://cdn.zabbet.com/providers/set/1_1_h/sbo.png',
    layout: 'wide-hero',
  },
  {
    code: 'lali',
    name: 'LALI',
    source: 'https://cdn.zabbet.com/providers/set/1_1_l/lali.png',
    layout: 'wide-banner',
  },
  {
    code: 'bcs',
    name: 'BCS',
    source: 'https://cdn.zabbet.com/providers/set/1_1_h/bcs.png',
    layout: 'half',
    isNew: true,
  },
  {
    code: 'muay',
    name: 'MUAY',
    source: 'https://cdn.zabbet.com/providers/set/1_1_h/muay.png',
    layout: 'half',
    isNew: true,
  },
  {
    code: 'saba',
    name: 'SABA',
    source: 'https://cdn.zabbet.com/providers/set/1_1_h/saba.png',
    layout: 'half',
  },
] as const;

export default function MobileSportProviderPage() {
  return (
    <MobileProviderLauncherPage
      category="sport"
      title={{ th: 'กีฬา', en: 'Sports' }}
      providers={SPORT_PROVIDERS}
    />
  );
}
