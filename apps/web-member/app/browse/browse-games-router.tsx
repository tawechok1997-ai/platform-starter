'use client';

import { useSearchParams } from 'next/navigation';
import { BrowseGames } from './public-browse';
import FishingBrowseSource from './fishing-browse-source';
import CasinoAllianceBand from './games/casino/casino-alliance-band';
import CasinoSourcePage from './games/casino/casino-source-page';
import SlotBrowseSource from './slot-browse-source';

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
  return <BrowseGames />;
}
