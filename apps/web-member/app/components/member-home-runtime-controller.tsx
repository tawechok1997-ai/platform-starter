'use client';

import { useLayoutEffect } from 'react';
import type { MemberTournamentRuntime } from '../member-home-data-runtime';
import { useMemberRuntime } from '../member-runtime-provider';
import type {
  MemberGameSectionRuntime,
  MemberLeaderboardEntry,
  MemberMiniGameRuntime,
  MemberQuickActionRuntime,
} from '../member-runtime-contract';

export default function MemberHomeRuntimeController() {
  const runtime = useMemberRuntime();

  useLayoutEffect(() => {
    let frame = 0;

    const sync = () => {
      frame = 0;
      syncAnnouncement(runtime);
      syncQuickActions(runtime.home.quickActions);
      syncTournament(runtime);
      syncTournamentBoards(runtime.homeData.tournaments, runtime.features.tournament && runtime.features.activity);
      syncJackpot(runtime);
      syncLeaderboard(runtime.homeData.leaderboard, runtime.home.leaderboard.title, runtime.home.leaderboard.enabled);
      syncMiniGames(runtime.homeData.miniGames, runtime.features.miniGames);
      syncSections(runtime.gameSections, runtime.features.usageGuide, runtime.home.sectionTitles.guide);
      setVisible('.v47-mobile-hero, .desktop-home .desktop-hero-carousel, .desktop-home [data-home-hero]', runtime.features.hero);
      setVisible('.reference-announcement, .v47-mobile-announcement', runtime.features.announcement);
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(sync);
    };

    sync();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', schedule);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [runtime]);

  return null;
}

function syncAnnouncement(runtime: ReturnType<typeof useMemberRuntime>) {
  const item = runtime.home.announcement;
  setText('.reference-announcement-track span, .v47-mobile-announcement > span', item.summary);
  setImage('.reference-announcement > img, .v47-mobile-announcement > img', item.icon || runtime.icons.announcement);
  document.querySelectorAll<HTMLElement>('.reference-announcement, .v47-mobile-announcement').forEach((element) => {
    element.dataset.announcementId = item.id;
    if (item.href) element.dataset.announcementHref = item.href;
    else delete element.dataset.announcementHref;
  });
}

function syncQuickActions(items: MemberQuickActionRuntime[]) {
  const desktop = Array.from(document.querySelectorAll<HTMLElement>('.reference-promo-row .reference-promo-card'));
  const mobile = Array.from(document.querySelectorAll<HTMLElement>('.v47-mobile-quick-grid .v47-mobile-quick-card'));

  items.forEach((item, index) => {
    const desktopCard = desktop[index];
    if (desktopCard) {
      desktopCard.hidden = !item.enabled;
      desktopCard.dataset.runtimeContentId = item.id;
      setWithinText(desktopCard, '.reference-promo-copy strong', item.title);
      setWithinText(desktopCard, '.reference-promo-copy small', item.summary);
      setWithinImage(desktopCard, '.reference-promo-background', item.image);
      setWithinImage(desktopCard, '.reference-promo-icon img', item.icon);
    }

    const mobileCard = mobile[index];
    if (mobileCard) {
      mobileCard.hidden = !item.enabled;
      mobileCard.dataset.runtimeContentId = item.id;
      setWithinText(mobileCard, 'strong', item.title);
      setWithinImage(mobileCard, 'img', item.icon);
      mobileCard.setAttribute('aria-label', item.title);
    }
  });
}

function syncTournament(runtime: ReturnType<typeof useMemberRuntime>) {
  const item = runtime.home.tournament;
  const enabled = runtime.features.tournament && runtime.features.activity;
  document.querySelectorAll<HTMLElement>('.reference-tournament-cta, .v47-mobile-tournament-banner').forEach((element) => {
    element.hidden = !enabled;
    element.dataset.runtimeContentId = item.id;
    if (element instanceof HTMLAnchorElement && item.href) element.href = item.href;
    setWithinImage(element, 'img', item.image);
    setWithinText(element, 'small', item.summary);
    setWithinText(element, 'strong', item.title);
  });
  setVisible('[data-section-kind="tournament"]', enabled);
  setText('.source-tournament__section-heading strong', runtime.home.tournament.title.includes('TOURNAMENT') ? 'ทัวร์นาเมนต์' : runtime.home.tournament.title);
  setImage('.source-tournament__section-heading img', runtime.icons.tournament);
}

function syncTournamentBoards(items: MemberTournamentRuntime[], enabled: boolean) {
  const desktopSlides = Array.from(document.querySelectorAll<HTMLElement>('.source-tournament__slide'));
  desktopSlides.forEach((slide, index) => {
    const tournament = items[index];
    slide.hidden = !enabled || !tournament;
    if (!tournament) return;
    slide.dataset.runtimeTournamentId = tournament.id;
    setWithinText(slide, '.source-tournament__title-row > strong', tournament.title);
    setWithinText(slide, '.source-tournament__status-row > span', tournament.status);
    const link = slide.querySelector<HTMLAnchorElement>('.source-tournament__all-button');
    if (link && link.href !== absolute(tournament.href)) link.href = tournament.href;

    const cards = Array.from(slide.querySelectorAll<HTMLElement>('.source-rank-card'));
    cards.forEach((card, playerIndex) => {
      const player = tournament.players[playerIndex];
      card.hidden = !player;
      if (!player) return;
      setWithinText(card, '.source-rank-card__badge strong', String(player.rank));
      setWithinText(card, '.source-rank-card__name', player.name);
      setWithinText(card, '.source-rank-card__score', String(player.score));
      card.querySelectorAll<HTMLElement>('.source-rank-stat small').forEach((stat, statIndex) => {
        const value = String(player.stats[statIndex] ?? 0);
        if (stat.textContent !== value) stat.textContent = value;
      });
    });
  });

  const pagination = Array.from(document.querySelectorAll<HTMLElement>('.source-tournament__pagination button'));
  pagination.forEach((button, index) => {
    button.hidden = !enabled || !items[index];
    if (items[index]) button.setAttribute('aria-label', items[index]!.title);
  });

  const primary = items[0];
  const mobilePanel = document.querySelector<HTMLElement>('.v47-mobile-rank-panel');
  if (!mobilePanel) return;
  mobilePanel.hidden = !enabled || !primary;
  if (!primary) return;
  mobilePanel.dataset.runtimeTournamentId = primary.id;
  setWithinText(mobilePanel, '.v47-mobile-rank-title strong', primary.title);
  const link = mobilePanel.querySelector<HTMLAnchorElement>('.v47-mobile-rank-title a');
  if (link && link.href !== absolute(primary.href)) link.href = primary.href;
  const cards = Array.from(mobilePanel.querySelectorAll<HTMLElement>('.v47-mobile-ranks article'));
  cards.forEach((card, index) => {
    const player = primary.players[index];
    card.hidden = !player;
    if (!player) return;
    setWithinText(card, '.v47-mobile-rank-badge b', String(player.rank));
    const name = Array.from(card.children).find((child) => child.tagName === 'SPAN' && !child.classList.contains('v47-mobile-rank-badge')) as HTMLElement | undefined;
    if (name && name.textContent !== player.name) name.textContent = player.name;
    setWithinText(card, ':scope > strong', String(player.score));
  });
}

function syncJackpot(runtime: ReturnType<typeof useMemberRuntime>) {
  const item = runtime.home.jackpot;
  setVisible('.home-jackpot, .v47-mobile-jackpot', item.enabled);
  setText('.home-jackpot__title, .v47-mobile-jackpot small', item.title);
  setText('.home-jackpot__value, .v47-mobile-jackpot strong', item.amount);
  setText('.v47-mobile-jackpot em', item.subtitle);
  setImage('.home-jackpot__art, .v47-mobile-jackpot > img', item.image);
  setImage('.home-jackpot__icon', item.icon);
}

function syncLeaderboard(entries: MemberLeaderboardEntry[], title: string, enabled: boolean) {
  setVisible('.reference-leaderboard, [data-section-kind="leaderboard"]', enabled);
  setText('.reference-leaderboard header strong, [data-section-kind="leaderboard"] .v47-mobile-section-title strong', title);

  const desktopRows = Array.from(document.querySelectorAll<HTMLElement>('.reference-leaderboard > div:not(.reference-leaderboard-head)'));
  desktopRows.forEach((row, index) => {
    const entry = entries[index];
    row.hidden = !entry;
    if (!entry) return;
    setWithinText(row, '.reference-rank-medal', String(entry.rank));
    setWithinText(row, 'span strong', entry.name);
    const smalls = row.querySelectorAll<HTMLElement>('span small');
    if (smalls[0] && smalls[0].textContent !== entry.user) smalls[0].textContent = entry.user;
    const amount = row.querySelector<HTMLElement>('span small b');
    if (amount && amount.textContent !== entry.amount) amount.textContent = entry.amount;
    if (entry.image) setWithinImage(row, '.reference-leaderboard-game-image', entry.image);
  });

  const mobileRows = Array.from(document.querySelectorAll<HTMLElement>('.v47-mobile-board-row'));
  mobileRows.forEach((row, index) => {
    const entry = entries[index];
    row.hidden = !entry;
    if (!entry) return;
    setWithinText(row, '.v47-mobile-board-badge b', String(entry.rank));
    const cells = row.querySelectorAll<HTMLElement>(':scope > span');
    if (cells[1] && cells[1].textContent !== entry.user) cells[1].textContent = entry.user;
    setWithinText(row, 'em', entry.amount);
  });
}

function syncMiniGames(items: MemberMiniGameRuntime[], enabled: boolean) {
  setVisible('[data-section-kind="mini"], .v47-mobile-mini-games', enabled);
  const cards = Array.from(document.querySelectorAll<HTMLAnchorElement>('.v47-mobile-mini-games > div > a'));
  cards.forEach((card, index) => {
    const item = items[index];
    card.hidden = !item?.enabled;
    if (!item) return;
    card.dataset.runtimeContentId = item.id;
    card.href = item.href;
    setWithinImage(card, 'img', item.image);
    setWithinText(card, 'strong', item.title);
    setWithinText(card, 'small', item.subtitle);
  });
}

function syncSections(sections: MemberGameSectionRuntime[], guideEnabled: boolean, guideTitle: string) {
  for (const section of sections) {
    const selector = `[data-section-kind="${section.id}"]`;
    setVisible(selector, section.enabled);
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      const heading = element.querySelector<HTMLElement>('header strong, .source-highlight-heading strong');
      if (heading && heading.textContent !== section.title) heading.textContent = section.title;
      const icon = element.querySelector<HTMLImageElement>('header img, .source-highlight-heading img');
      if (icon && section.icon && icon.src !== absolute(section.icon)) icon.src = section.icon;
      element.dataset.runtimeSectionId = section.id;
      element.dataset.runtimeDesktopLimit = String(section.desktopLimit);
      element.dataset.runtimeMobileLimit = String(section.mobileLimit);
    });
  }

  setVisible('[data-section-kind="guide"], .reference-guide, .v47-mobile-guide', guideEnabled);
  setText('[data-section-kind="guide"] header strong, .reference-guide header strong, .v47-mobile-guide header strong', guideTitle);
}

function setText(selector: string, value: string) {
  if (!value) return;
  document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    if (element.textContent !== value) element.textContent = value;
  });
}

function setImage(selector: string, value: string) {
  if (!value) return;
  document.querySelectorAll<HTMLImageElement>(selector).forEach((image) => {
    if (image.src !== absolute(value)) image.src = value;
  });
}

function setVisible(selector: string, visible: boolean) {
  document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    if (element.hidden === visible) element.hidden = !visible;
    element.dataset.runtimeVisible = visible ? 'true' : 'false';
  });
}

function setWithinText(root: Element, selector: string, value: string) {
  if (!value) return;
  const element = root.querySelector<HTMLElement>(selector);
  if (element && element.textContent !== value) element.textContent = value;
}

function setWithinImage(root: Element, selector: string, value: string) {
  if (!value) return;
  const image = root.querySelector<HTMLImageElement>(selector);
  if (image && image.src !== absolute(value)) image.src = value;
}

function absolute(value: string) {
  try {
    return new URL(value, window.location.origin).href;
  } catch {
    return value;
  }
}
