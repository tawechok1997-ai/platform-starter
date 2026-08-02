'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LIVE_ROUTE,
  LIVE_SERVICE_COPY,
  LIVE_SERVICE_STATUS,
} from '../lib/live-service-status';
import { useMemberLocale } from '../member-locale-provider';

const LIVE_ACTION_SELECTOR = [
  '.source-live-card__watch',
  '.source-live-card__bet',
  '.member-desktop-nav a[href="#live"]',
  '.member-desktop-nav a[href="/#live"]',
  'a[href="/mobile/member/live"]',
  'a[href="/mobile-menu/live"]',
].join(',');

const LEGACY_LIVE_LINK_SELECTOR = [
  '.member-desktop-nav a[href="#live"]',
  '.member-desktop-nav a[href="/#live"]',
  'a[href="/mobile/member/live"]',
  'a[href="/mobile-menu/live"]',
].join(',');

export default function PublicLiveNavigationController() {
  const router = useRouter();
  const { locale } = useMemberLocale();
  const copy = LIVE_SERVICE_COPY[locale];

  useEffect(() => {
    let frame = 0;

    const applyState = () => {
      frame = 0;
      normalizeLiveLinks();
      if (LIVE_SERVICE_STATUS.mode === 'maintenance') applyMaintenanceCopy(copy);
    };

    const scheduleApply = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(applyState);
    };

    scheduleApply();
    const observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, { childList: true, subtree: true });

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;

      const liveAction = target.closest<HTMLElement>(LIVE_ACTION_SELECTOR);
      if (!liveAction) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      router.push(LIVE_ROUTE);
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('click', handleClick, true);
    };
  }, [copy, router]);

  return (
    <style jsx global>{`
      .source-feed-host--live[data-live-service-status='maintenance'] .source-feed-heading__notice {
        color: #ffcf70;
        opacity: 1;
      }

      .source-live-card[data-live-service-status='maintenance'] .source-live-card__inner {
        border-color: rgba(255, 184, 72, 0.42);
      }

      .source-live-card[data-live-service-status='maintenance'] .source-live-card__status b {
        background: linear-gradient(180deg, #d98619 0%, #9d5000 100%);
      }

      .source-live-card[data-live-service-status='maintenance'] .source-live-card__status time {
        max-width: 160px;
        color: #ffcf70;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .source-live-card[data-live-service-status='maintenance'] .source-live-card__watch,
      .source-live-card[data-live-service-status='maintenance'] .source-live-card__bet {
        border-color: rgba(255, 184, 72, 0.35);
        background: linear-gradient(180deg, #5a5363 0%, #312c38 100%);
      }
    `}</style>
  );
}

function normalizeLiveLinks() {
  document.querySelectorAll<HTMLAnchorElement>(LEGACY_LIVE_LINK_SELECTOR).forEach((link) => {
    if (link.getAttribute('href') !== LIVE_ROUTE) link.setAttribute('href', LIVE_ROUTE);
  });
}

function applyMaintenanceCopy(copy: (typeof LIVE_SERVICE_COPY)[keyof typeof LIVE_SERVICE_COPY]) {
  const section = document.querySelector<HTMLElement>('.source-feed-host--live');
  if (!section) return;

  setAttribute(section, 'data-live-service-status', LIVE_SERVICE_STATUS.mode);
  setText(section.querySelector('.source-feed-heading__notice'), copy.title);

  section.querySelectorAll<HTMLElement>('.source-live-card').forEach((card) => {
    setAttribute(card, 'data-live-service-status', LIVE_SERVICE_STATUS.mode);
    setText(card.querySelector('.source-live-card__status b'), copy.tableStatus);
    setText(card.querySelector('.source-live-card__status time'), copy.tableDescription);
    setText(card.querySelector('.source-live-card__watch span'), copy.details);
    setText(card.querySelector('.source-live-card__bet'), copy.badge);
    card.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      button.setAttribute('aria-label', `${copy.details}: ${copy.title}`);
      button.title = copy.description;
    });
  });
}

function setText(element: Element | null, value: string) {
  if (element && element.textContent !== value) element.textContent = value;
}

function setAttribute(element: Element, name: string, value: string) {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}
