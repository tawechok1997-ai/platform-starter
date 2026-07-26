import { Suspense } from 'react';
import { BrowseGames } from '../public-browse';

export default function PublicGamesBrowsePage() {
  return (
    <Suspense fallback={<main className="browse-page"><section className="browse-empty"><strong>กำลังโหลดรายการเกม...</strong></section></main>}>
      <BrowseGames />
    </Suspense>
  );
}
