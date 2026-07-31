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
  memberPromotionImage,
  type MemberPromotionCampaign,
} from '../../member-promotion-runtime';
import { useMemberRuntime } from '../../member-runtime-provider';
import styles from './mobile-source-home-shell.module.css';

const MAX_PROMOTIONS = 10;
const MOBILE_CATEGORY_IDS = new Set(['home', 'casino', 'slot', 'fishing', 'sport', 'card', 'lottery']);
const PROMOTION_FALLBACKS = MEMBER_PROMOTION_FALLBACKS.filter((item) => item.enabled).slice(0, MAX_PROMOTIONS);
const SHORTCUT_BACKGROUND_FALLBACK =
  'https://cdn.zabbet.com/FEZX/lobby_settings/fc6b7ea8-3eaf-47ec-8640-33c7138d3c7c.png';
const SHORTCUT_ICON_FALLBACK =
  'https://cdn.zabbet.com/FEZX/lobby_settings/083e4b9b-63aa-4825-a0e3-57a88de57e2f.ico';

type Props = {
  children: ReactNode;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type ShortcutPlatform = 'android' | 'ios';

export default function MobileSourceHomeShell({ children }: Props) {
  const { features, home, icons, navigation, resolveAsset, summary } = useMemberRuntime();
  const [promotions, setPromotions] = useState<MemberPromotionCampaign[]>(PROMOTION_FALLBACKS);
  const [activePromotion, setActivePromotion] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [shortcutMessage, setShortcutMessage] = useState('');
  const promotionRailRef = useRef<HTMLDivElement | null>(null);

  const categories = useMemo(
    () => navigation.filter((item) => item.mobile && MOBILE_CATEGORY_IDS.has(item.id)),
    [navigation],
  );

  const shortcutBackground = resolveAsset({
    aliases: ['home shortcut', 'add to home', 'ปุ่มลัดหน้าโฮม', 'download background'],
    remoteFallback: SHORTCUT_BACKGROUND_FALLBACK,
  });
  const shortcutIcon = resolveAsset({
    aliases: ['home shortcut icon', 'add to home icon', 'favicon', 'ปุ่มลัด'],
    remoteFallback: SHORTCUT_ICON_FALLBACK,
  });

  useEffect(() => {
    const controller = new AbortController();

    void loadMemberPromotionCampaigns(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        const next = items.filter((item) => item.enabled).slice(0, MAX_PROMOTIONS);
        setPromotions(next.length ? next : PROMOTION_FALLBACKS);
        setActivePromotion(0);
        promotionRailRef.current?.scrollTo({ left: 0, behavior: 'auto' });
      })
      .catch(() => {
        if (!controller.signal.aborted) setPromotions(PROMOTION_FALLBACKS);
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

  const announcementText = home.announcement.summary || home.announcement.title;
  const showGuestActions = !summary.isLoggedIn && (features.registration || features.login);

  return (
    <section className={styles.shell} aria-label="หน้าแรกมือถือ">
      <div className={styles.topArea}>
        {features.promotion && promotions.length ? (
          <section className={styles.promotionSection} aria-label="โปรโมชั่น">
            <div
              ref={promotionRailRef}
              className={styles.promotionRail}
              onScroll={syncPromotionFromScroll}
              data-drag-scroll="true"
            >
              {promotions.map((promotion, index) => {
                const image = memberPromotionImage(promotion);
                return (
                  <a
                    key={promotion.id}
                    className={styles.promotionSlide}
                    href={promotion.href || `/browse/promotions/${encodeURIComponent(promotion.id)}`}
                    aria-label={promotion.title}
                  >
                    <img
                      src={image}
                      alt={promotion.title}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      onError={(event) => swapBrokenImage(event, promotion.sourceImageUrl)}
                    />
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

        {features.announcement && announcementText ? (
          <section className={styles.announcement} aria-label="ประกาศ">
            <RuntimeIcon value={home.announcement.icon || icons.announcement} />
            <div className={styles.announcementViewport}>
              {home.announcement.href ? (
                <a href={home.announcement.href}>{announcementText}</a>
              ) : (
                <span>{announcementText}</span>
              )}
            </div>
          </section>
        ) : null}
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
          <section className={styles.shortcutCard} aria-labelledby="mobile-home-shortcut-title">
            <img
              className={styles.shortcutBackdrop}
              src={shortcutBackground}
              alt=""
              aria-hidden="true"
              onError={hideBrokenImage}
            />
            <div className={styles.shortcutCopy}>
              <h2 id="mobile-home-shortcut-title">เพิ่มปุ่มลัดหน้าโฮม</h2>
              <strong>เพิ่มปุ่มลัดได้แล้ววันนี้!</strong>
              <p>สัมผัสประสบการณ์ที่เหนือกว่า เพิ่มปุ่มเลย</p>
              <div className={styles.shortcutButtons}>
                <button type="button" onClick={() => void requestHomeShortcut('android')}>Android</button>
                <button type="button" onClick={() => void requestHomeShortcut('ios')}>iOS</button>
              </div>
              {shortcutMessage ? <p className={styles.shortcutMessage} role="status">{shortcutMessage}</p> : null}
            </div>
            <img
              className={styles.shortcutIcon}
              src={shortcutIcon}
              alt="โลโก้ปุ่มลัด"
              loading="lazy"
              onError={hideBrokenImage}
            />
          </section>
        </div>
      </div>
    </section>
  );
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
  if (!fallback || image.dataset.fallbackApplied === 'true' || image.src === fallback) {
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
