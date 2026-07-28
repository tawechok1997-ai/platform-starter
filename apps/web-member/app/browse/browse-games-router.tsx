'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { BrowseGames } from './public-browse';
import CardBrowseSource from './card-browse-source';
import FishingBrowseSource from './fishing-browse-source';
import CasinoSourcePage from './games/casino/casino-source-page';
import LottoBrowseSource from './lotto-browse-source';
import SlotBrowseSource from './slot-browse-source';
import SportBrowseSource from './sport-browse-source';

export default function BrowseGamesRouter() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category')?.toLowerCase() ?? '';

  if (category === 'casino') return <CasinoSourcePage />;
  if (category === 'slot') return <SlotBrowseSource />;
  if (category === 'fishing') return <FishingBrowseSource />;
  if (category === 'sport' || category === 'sports') return <SportBrowseSource />;
  if (category === 'card') return <CardBrowseSource />;
  if (category === 'lotto' || category === 'lottery') return <LottoBrowseSource />;
  if (category === 'live') return <LiveHomeRedirect />;

  return <BrowseGames />;
}

function LiveHomeRedirect() {
  useEffect(() => {
    window.location.replace('/#live');
  }, []);

  return <main className="member-loading-screen">กำลังเปิดหน้าถ่ายทอดสด...</main>;
}
