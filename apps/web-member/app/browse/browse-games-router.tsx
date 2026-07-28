'use client';

import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { BrowseGames } from './public-browse';
import CardBrowseSource from './card-browse-source';
import FishingBrowseSource from './fishing-browse-source';
import CasinoAllianceBand from './games/casino/casino-alliance-band';
import CasinoSourcePage from './games/casino/casino-source-page';
import LottoBrowseSource from './lotto-browse-source';
import SlotBrowseSource from './slot-browse-source';
import SportBrowseSource from './sport-browse-source';

function FixedHeaderOffset({ children }: { children: ReactNode }) {
  return <div className="browse-fixed-header-offset">{children}</div>;
}

export default function BrowseGamesRouter() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');

  if (category === 'casino') {
    return (
      <>
        <CasinoSourcePage />
        <CasinoAllianceBand />
      </>
    );
  }
  if (category === 'slot') return <FixedHeaderOffset><SlotBrowseSource /></FixedHeaderOffset>;
  if (category === 'fishing') return <FixedHeaderOffset><FishingBrowseSource /></FixedHeaderOffset>;
  if (category === 'sport' || category === 'sports') return <SportBrowseSource />;
  if (category === 'card') return <FixedHeaderOffset><CardBrowseSource /></FixedHeaderOffset>;
  if (category === 'lotto' || category === 'lottery') return <LottoBrowseSource />;
  return <BrowseGames />;
}
