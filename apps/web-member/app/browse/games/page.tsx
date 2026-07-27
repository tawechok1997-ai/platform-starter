import { Suspense } from 'react';
import BrowseGamesRouter from '../browse-games-router';

export default function PublicGamesBrowsePage() {
  return (
    <Suspense fallback={<main className="browse-page"><section className="browse-empty"><strong>กำลังโหลดรายการเกม...</strong></section></main>}>
      <BrowseGamesRouter />
    </Suspense>
  );
}
