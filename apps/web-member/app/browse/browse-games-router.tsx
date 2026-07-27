'use client';

import { useSearchParams } from 'next/navigation';
import { BrowseGames } from './public-browse';
import FishingBrowseSource from './fishing-browse-source';
import CasinoAllianceBand from './games/casino/casino-alliance-band';
import CasinoSourcePage from './games/casino/casino-source-page';
import LottoBrowseSource from './lotto-browse-source';
import SlotBrowseSource from './slot-browse-source';
import SportBrowseSource from './sport-browse-source';

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
  if (category === 'slot') return <SlotBrowseSource />;
  if (category === 'fishing') return <FishingBrowseSource />;
  if (category === 'sport' || category === 'sports') return <SportBrowseSource />;
  if (category === 'lotto' || category === 'lottery') return <LottoBrowseSource />;
  return <BrowseGames />;
}
