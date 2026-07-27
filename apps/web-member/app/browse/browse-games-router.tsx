'use client';

import { useSearchParams } from 'next/navigation';
import { BrowseGames } from './public-browse';
import SlotBrowseSource from './slot-browse-source';

export default function BrowseGamesRouter() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');

  if (category === 'slot') return <SlotBrowseSource />;
  return <BrowseGames />;
}
