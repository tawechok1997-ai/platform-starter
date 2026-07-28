'use client';

import { useSearchParams } from 'next/navigation';
import { BrowseGames } from './public-browse';
import CasinoSourcePage from './games/casino/casino-source-page';
import SlotBrowseSource from './slot-browse-source';

export default function BrowseGamesRouter() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');

  if (category === 'casino') return <CasinoSourcePage />;
  if (category === 'slot') return <SlotBrowseSource />;

  return <BrowseGames />;
}
