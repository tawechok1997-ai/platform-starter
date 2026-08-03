'use client';

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import SourceGameCategoryPage, {
  type SourceGameCategoryConfig,
  type SourceGameFilterKey,
} from './source-game-category-page';
import {
  loadSourceCategoryCatalog,
  type SourceCategoryCatalog,
} from './source-game-catalog';

const MOBILE_QUERY = '(max-width: 900px)';

type MobileCategoryMeta = {
  title: string;
  assetFolder: string;
  filters: Array<{ key: SourceGameFilterKey; label: string }>;
};

const CATEGORY_META = {
  casino: {
    title: 'คาสิโน',
    assetFolder: 'casino',
    filters: [{ key: 'new', label: 'เกมส์ใหม่' }, { key: 'hot', label: 'เกมส์ฮิต' }],
  },
  slot: {
    title: 'สล็อต',
    assetFolder: 'slot',
    filters: [
      { key: 'arcade', label: 'เกมส์อาเขต' },
      { key: 'buy', label: 'ซื้อฟรีสปิน' },
      { key: 'hot', label: 'เกมส์ฮิต' },
      { key: 'new', label: 'เกมส์ใหม่' },
      { key: 'slot', label: 'เกมส์สล็อต' },
      { key: 'table', label: 'เกมส์โต๊ะ' },
    ],
  },
  fishing: {
    title: 'ยิงปลา',
    assetFolder: 'fishing',
    filters: [
      { key: 'hot', label: 'เกมส์ฮิต' },
      { key: 'new', label: 'เกมส์ใหม่' },
      { key: 'slot', label: 'เกมส์สล็อต' },
    ],
  },
  sport: {
    title: 'กีฬา',
    assetFolder: 'sport',
    filters: [{ key: 'new', label: 'เกมส์ใหม่' }, { key: 'hot', label: 'เกมส์ฮิต' }],
  },
  card: {
    title: 'ไพ่',
    assetFolder: 'card',
    filters: [{ key: 'new', label: 'เกมส์ใหม่' }, { key: 'hot', label: 'เกมส์ฮิต' }, { key: 'table', label: 'เกมส์โต๊ะ' }],
  },
  lotto: {
    title: 'หวย',
    assetFolder: 'lotto',
    filters: [{ key: 'new', label: 'เกมส์ใหม่' }, { key: 'hot', label: 'เกมส์ฮิต' }],
  },
} satisfies Record<string, MobileCategoryMeta>;

type MobileCategorySlug = keyof typeof CATEGORY_META;

export default function MobileApiCategoryOwner({
  slug,
  desktop,
}: {
  slug: MobileCategorySlug;
  desktop: ReactNode;
}) {
  const [mobile, setMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  if (mobile === null) {
    return <main className="member-loading-screen">กำลังตรวจสอบชุดเกม...</main>;
  }
  if (!mobile) return <>{desktop}</>;
  return <MobileApiCategoryPage slug={slug} />;
}

function MobileApiCategoryPage({ slug }: { slug: MobileCategorySlug }) {
  const [catalog, setCatalog] = useState<SourceCategoryCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setCatalog(null);

    void loadSourceCategoryCatalog(slug, [], 'mobile', controller.signal)
      .then((result) => {
        if (cancelled) return;
        setCatalog(result);
        setFailed(result.games.length === 0);
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) return;
        setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [slug]);

  const config = useMemo<SourceGameCategoryConfig | null>(() => {
    if (!catalog?.games.length) return null;
    const meta = CATEGORY_META[slug];
    const filters = meta.filters.map((filter) => ({
      ...filter,
      count: catalog.games.filter((game) => game.tags.includes(filter.key)).length,
    })).filter((filter) => filter.count > 0);

    return {
      slug,
      title: meta.title,
      total: catalog.games.length,
      resultUnit: 'เกม',
      mode: 'games',
      baseBackground: `/assets/asset-pc/images/game/${meta.assetFolder}/bg_${meta.assetFolder}.webp`,
      baseLogo: `/assets/asset-pc/images/game/${meta.assetFolder}/logo_${meta.assetFolder}.webp`,
      filters,
      providers: catalog.providers,
      games: catalog.games,
      showProviderStrip: true,
      showAllProviders: false,
    };
  }, [catalog, slug]);

  if (loading) {
    return <main className="member-loading-screen">กำลังโหลดเกมจาก API...</main>;
  }

  if (failed || !catalog || !config) {
    return (
      <main
        className="browse-page"
        data-mobile-category-api="empty"
        data-source-game-category={slug}
      >
        <section className="browse-empty">
          <strong>ยังไม่มีเกมจาก API สำหรับหมวดนี้</strong>
          <span>ระบบจะไม่แสดงรายการเกมจำลองแทนข้อมูลจริง</span>
        </section>
      </main>
    );
  }

  return (
    <div
      data-mobile-category-api="connected"
      data-mobile-category-source-platform={catalog.sourcePlatform ?? 'mobile'}
    >
      <SourceGameCategoryPage config={config} />
    </div>
  );
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}
