'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
  type UIEvent,
} from 'react';
import {
  MEMBER_PROMOTION_FALLBACKS,
  loadMemberPromotionCampaigns,
  memberPromotionImageForViewport,
  type MemberPromotionCampaign,
} from '../../member-promotion-runtime';
import { useMemberRuntime } from '../../member-runtime-provider';
import {
  MOBILE_SOURCE_ASSETS,
  isSameSourceAsset,
  sourceAssetFileName,
} from './mobile-source-asset-map';
import styles from './mobile-source-home-shell.module.css';

const MAX_PROMOTIONS = 10;
const MOBILE_CATEGORY_IDS = new Set(['home', 'casino', 'slot', 'fishing', 'sport', 'card', 'lottery']);
const SHORTCUT_CARD_BACKGROUND = '/images/shortcut/bg_card.webp';
const MOBILE_PROMOTION_FALLBACKS = MOBILE_SOURCE_ASSETS.promotionSlides.map((imageUrl, index) => {
  const seed = MEMBER_PROMOTION_FALLBACKS[index % MEMBER_PROMOTION_FALLBACKS.length]!;
  return {
    ...seed,
    id: `mobile-source-slide-${index + 1}`,
    title: seed.title || `โปรโมชั่น ${index + 1}`,
    imageUrl,
    mobileImageUrl: imageUrl,
    sourceImageUrl: imageUrl,
    href: index === MOBILE_SOURCE_ASSETS.promotionSlides.length - 1 ? '/promotions' : seed.href || '/promotions',
  } satisfies MemberPromotionCampaign;
});

type Props = {
  children: ReactNode;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type ShortcutPlatform = 'android' | 'ios';

export default function MobileSourceHomeShell({ children }: Props) {
  const { features, home, icons, navigation, resolveAsset } = useMemberRuntime();
  const [promotions, setPromotions] = useState<MemberPromotionCampaign[]>(MOBILE_PROMOTION_FALLBACKS);
  const [activePromotion, setActivePromotion] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [shortcutMessage, setShortcutMessage] = useState('');
  const promotionRailRef = useRef<HTMLDivElement | null>(null);

  const categories = useMemo(
    () => navigation.filter((item) => item.mobile && MOBILE_CATEGORY_IDS.has(item.id)),
    [navigation],
  );

  const shortcutArt = resolveAsset({
    aliases: ['home shortcut mobile', 'home shortcut', 'add to home', 'ปุ่มลัดหน้าโฮม', 'download background'],
    remoteFallback: MOBILE_SOURCE_ASSETS.shortcutBackground,
  });
  const shortcutIcon = resolveAsset({
    aliases: ['home shortcut icon mobile', 'home shortcut icon', 'add to home icon', 'favicon', 'ปุ่มลัด'],
    remoteFallback: MOBILE_SOURCE_ASSETS.shortcutIcon,
  });

  useEffect(() => {
    const controller = new AbortController();

    void loadMemberPromotionCampaigns(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        const enabled = items.filter((item) => item.enabled).slice(0, MAX_PROMOTIONS);
        const next = enabled.map((item, index) => applyMobilePromotionFallback(item, index));
        setPromotions(next.length ? next : MOBILE_PROMOTION_FALLBACKS);
        setActivePromotion(0);
        promotionRailRef.current?.scrollTo({ left: 0, behavior: 'auto' });
      })
      .catch(() => {
        if (!controller.signal.aborted) setPromotions(MOBILE_PROMOTION_FALLBACKS);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
  }, []);

  useEffect(() => {
    if (promotions.length < 2) return;

    const timer = window.setInterval(() => {
      setActivePromotion((current) => {
        const next = (current + 1) % promotions.length;
        scrollPromotionRail(promotionRailRef.current, next);
        return next;
      });
    }, 5_000);

    return () => window.clearInterval(timer);
  }, [promotions.length]);

  function selectPromotion(index: number) {
    setActivePromotion(index);
    scrollPromotionRail(promotionRailRef.current, index);
  }

  function syncPromotionFromScroll(event: UIEvent<HTMLDivElement>) {
    const rail = event.currentTarget;
    if (!rail.clientWidth) return;
    const next = Math.max(0, Math.min(promotions.length - 1, Math.round(rail.scrollLeft / rail.clientWidth)));
    setActivePromotion(next);
  }

  async function requestHomeShortcut(platform: ShortcutPlatform) {
    window.dispatchEvent(new CustomEvent('member-home-shortcut-request', { detail: { platform } }));

    if (platform === 'android' && installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice.catch(() => ({ outcome: 'dismissed' as const }));
      setInstallPrompt(null);
      setShortcutMessage(
        choice.outcome === 'accepted'
          ? 'เพิ่มปุ่มลัดลงหน้าโฮมแล้ว'
          : 'ยังไม่ได้เพิ่มปุ่มลัด สามารถกด Android เพื่อลองใหม่ได้',
      );
      return;
    }

    setShortcutMessage(
      platform === 'ios'
        ? 'บน iPhone ให้แตะปุ่มแชร์ แล้วเลือก “เพิ่มไปยังหน้าจอโฮม”'
        : 'เปิดเมนูเบราว์เซอร์ แล้วเลือก “ติดตั้งแอป” หรือ “เพิ่มไปยังหน้าจอโฮม”',
    );
  }

  const announcementText = home.announcement.summary || home.announcement.title || 'ประกาศจากระบบ';
  const showGuestActions = features.registration || features.login;

  return (
    <section className={`${styles.shell} member-mobile-source-shell`} aria-label="หน้าแรกมือถือ">
      <div className={`${styles.topArea} member-mobile-source-top-area`}>
        {features.promotion && promotions.length ? (
          <section className={`${styles.promotionSection} member-mobile-source-promotion`} aria-label="โปรโมชั่น">
            <div
              ref={promotionRailRef}
              className={styles.promotionRail}
              onScroll={syncPromotionFromScroll}
              data-drag-scroll="true"
            >
              {promotions.map((promotion, index) => {
                const image = memberPromotionImageForViewport(promotion, 'mobile');
                const fallback = MOBILE_PROMOTION_FALLBACKS[index % MOBILE_PROMOTION_FALLBACKS.length]!.mobileImageUrl;
                return (
                  <a
                    key={promotion.id}
                    className={styles.promotionSlide}
                    href={promotion.href || `/browse/promotions/${encodeURIComponent(promotion.id)}`}
                    aria-label={promotion.title}
                    data-mobile-asset={sourceAssetFileName(image)}
                  >
                    <span className={styles.promotionFrame}>
                      <img
                        src={image}
                        alt={promotion.title}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        onError={(event) => swapBrokenImage(event, fallback)}
                      />
                    </span>
                  </a>
                );
              })}
            </div>
            {promotions.length > 1 ? (
              <div className={styles.promotionDots} aria-label="เลือกโปรโมชั่น">
                {promotions.map((promotion, index) => (
                  <button
                    key={promotion.id}
                    type="button"
                    className={index === activePromotion ? styles.activeDot : undefined}
                    onClick={() => selectPromotion(index)}
                    aria-label={`โปรโมชั่น ${index + 1}: ${promotion.title}`}
                    aria-current={index === activePromotion ? 'true' : undefined}
                  />
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {showGuestActions ? (
          <nav className={styles.authActions} aria-label="บัญชีสมาชิก">
            {features.registration ? (
              <a className={styles.registerButton} href="/?auth=register">
                <span>สมัครสมาชิก</span>
              </a>
            ) : null}
            {features.login ? (
              <a className={styles.loginButton} href="/?auth=login">
                <span>เข้าสู่ระบบ</span>
              </a>
            ) : null}
          </nav>
        ) : null}

        <section
          className={`${styles.announcement} member-mobile-source-announcement`}
          aria-label="ประกาศ"
          data-runtime-enabled={features.announcement ? 'true' : 'false'}
        >
          <RuntimeIcon value={home.announcement.icon || icons.announcement} />
          <div className={styles.announcementViewport}>
            {home.announcement.href ? (
              <a href={home.announcement.href}>{announcementText}</a>
            ) : (
              <span>{announcementText}</span>
            )}
          </div>
        </section>
      </div>

      <div className={styles.mobileBody}>
        <nav className={styles.categoryRail} aria-label="หมวดเกม">
          {categories.map((item) => (
            <a
              key={item.id}
              className={item.id === 'home' ? styles.activeCategory : undefined}
              href={item.href}
              aria-current={item.id === 'home' ? 'page' : undefined}
            >
              <RuntimeIcon value={item.icon} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className={styles.contentColumn}>
          {children}
          <section className={styles.shortcutSection} aria-labelledby="mobile-home-shortcut-title">
            <h2 id="mobile-home-shortcut-title">เพิ่มปุ่มลัดหน้าโฮม</h2>
            <div className={styles.shortcutCard}>
              <img className={styles.shortcutBackdrop} src={SHORTCUT_CARD_BACKGROUND} alt="" aria-hidden="true" />
              <img className={styles.shortcutArt} src={shortcutArt} alt="" aria-hidden="true" onError={hideBrokenImage} />
              <div className={styles.shortcutCopy}>
                <div className={styles.shortcutIntro}>
                  <img src={shortcutIcon} alt="โลโก้" loading="lazy" onError={hideBrokenImage} />
                  <span>
                    <strong>เพิ่มปุ่มลัดได้แล้ววันนี้!</strong>
                    <small>สัมผัสประสบการณ์ที่เหนือกว่า เพิ่มปุ่มเลย</small>
                  </span>
                </div>
                <div className={styles.shortcutButtons}>
                  <button
                    type="button"
                    className={installPrompt ? styles.androidReady : styles.androidButton}
                    onClick={() => void requestHomeShortcut('android')}
                  >
                    <span aria-hidden="true">◉</span>
                    Android
                  </button>
                  <button type="button" className={styles.iosButton} onClick={() => void requestHomeShortcut('ios')}>
                    <span aria-hidden="true">●</span>
                    iOS
                  </button>
                </div>
                {shortcutMessage ? <p className={styles.shortcutMessage} role="status">{shortcutMessage}</p> : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function applyMobilePromotionFallback(item: MemberPromotionCampaign, index: number) {
  const fallback = MOBILE_PROMOTION_FALLBACKS[index % MOBILE_PROMOTION_FALLBACKS.length]!;
  const hasDedicatedMobileAsset = Boolean(
    item.mobileImageUrl
    && !isSameSourceAsset(item.mobileImageUrl, item.desktopImageUrl)
    && !isSameSourceAsset(item.mobileImageUrl, item.imageUrl),
  );

  if (hasDedicatedMobileAsset) return item;
  return {
    ...item,
    mobileImageUrl: fallback.mobileImageUrl,
  };
}

function RuntimeIcon({ value }: { value: string }) {
  if (isImageValue(value)) {
    return <img src={value} alt="" aria-hidden="true" loading="lazy" onError={hideBrokenImage} />;
  }
  return <span aria-hidden="true">{value}</span>;
}

function scrollPromotionRail(rail: HTMLDivElement | null, index: number) {
  if (!rail) return;
  rail.scrollTo({ left: rail.clientWidth * index, behavior: 'smooth' });
}

function swapBrokenImage(event: SyntheticEvent<HTMLImageElement>, fallback: string) {
  const image = event.currentTarget;
  if (!fallback || image.dataset.fallbackApplied === 'true' || image.src.endsWith(fallback)) {
    image.hidden = true;
    return;
  }
  image.dataset.fallbackApplied = 'true';
  image.src = fallback;
}

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.hidden = true;
}

function isImageValue(value: string) {
  return value.startsWith('/') || /^https?:\/\//i.test(value) || /\.(?:avif|gif|ico|jpe?g|png|svg|webp)(?:\?|$)/i.test(value);
}
