'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { BrowseGames } from './public-browse';
import CardBrowseSource from './card-browse-source';
import FishingBrowseSource from './fishing-browse-source';
import CasinoSourcePage from './games/casino/casino-source-page';
import LottoBrowseSource from './lotto-browse-source';
import MobileApiCategoryOwner from './mobile-api-category-owner';
import SlotBrowseSource from './slot-browse-source';
import SourceFilterStickyBehavior from './source-filter-sticky-behavior';
import SportBrowseSource from './sport-browse-source';

export default function BrowseGamesRouter() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category')?.toLowerCase() ?? '';

  let content;

  if (category === 'casino') {
    content = <MobileApiCategoryOwner slug="casino" desktop={<CasinoSourcePage />} />;
  } else if (category === 'slot') {
    content = <MobileApiCategoryOwner slug="slot" desktop={<SlotBrowseSource />} />;
  } else if (category === 'fishing') {
    content = <MobileApiCategoryOwner slug="fishing" desktop={<FishingBrowseSource />} />;
  } else if (category === 'sport' || category === 'sports') {
    content = <MobileApiCategoryOwner slug="sport" desktop={<SportBrowseSource />} />;
  } else if (category === 'card') {
    content = <MobileApiCategoryOwner slug="card" desktop={<CardBrowseSource />} />;
  } else if (category === 'lotto' || category === 'lottery') {
    content = <MobileApiCategoryOwner slug="lotto" desktop={<LottoBrowseSource />} />;
  } else if (category === 'live') {
    content = <LiveHomeRedirect />;
  } else {
    content = <BrowseGames />;
  }

  return (
    <>
      <SourceFilterStickyBehavior />
      {content}
    </>
  );
}

function LiveHomeRedirect() {
  useEffect(() => {
    window.location.replace('/#live');
  }, []);

  return <main className="member-loading-screen">กำลังเปิดหน้าถ่ายทอดสด...</main>;
}
