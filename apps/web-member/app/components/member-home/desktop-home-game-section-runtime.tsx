'use client';

import { useEffect } from 'react';
import { getMemberGameCatalog, type MemberCatalogGame } from '../../lib/member-game-catalog';
import { selectHomeGameSection } from '../../lib/home-game-selection';
import { useSiteSettings } from '../../site-settings-provider';

type SectionGames = {
  featured: MemberCatalogGame[];
  popular: MemberCatalogGame[];
  online: MemberCatalogGame[];
  classic: MemberCatalogGame[];
};

type SectionPlan = {
  key: keyof SectionGames;
  limit: number;
};

const SECTION_PLANS: readonly SectionPlan[] = [
  { key: 'featured', limit: 8 },
  { key: 'popular', limit: 10 },
  { key: 'online', limit: 6 },
  { key: 'classic', limit: 6 },
];

const artworkCache = new Map<string, Promise<string>>();

export default function DesktopHomeGameSectionRuntime() {
  const { typedSettings } = useSiteSettings();
  const featureSettings = typedSettings.features as Record<string, unknown>;

  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;
    let frame = 0;

    void getMemberGameCatalog('pc').then(async (catalog) => {
      const sections = await buildRenderableSections(catalog, featureSettings);
      if (cancelled) return;

      const apply = () => {
        frame = 0;
        syncHighlight(sections.featured);
        syncPopular(sections.popular);
        syncOnline(sections.online);
        syncClassic(sections.classic);
      };
      const schedule = () => {
        if (frame) return;
        frame = window.requestAnimationFrame(apply);
      };

      apply();
      const root = document.querySelector('.desktop-home') ?? document.body;
      observer = new MutationObserver(schedule);
      observer.observe(root, { childList: true, subtree: true });
    }).catch(() => {
      // Existing component-owned fallbacks remain visible when the catalog is unavailable.
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [featureSettings]);

  return null;
}

async function buildRenderableSections(
  catalog: readonly MemberCatalogGame[],
  featureSettings: Record<string, unknown>,
): Promise<SectionGames> {
  const entries = await Promise.all(SECTION_PLANS.map(async ({ key, limit }) => {
    // Ask for a wider ranked pool so broken demo/CDN artwork can be skipped
    // without leaving an empty card in the visible strip.
    const candidates = selectHomeGameSection(catalog, key, 'pc', featureSettings, 30);
    const games = await keepLoadableArtwork(candidates, limit);
    return [key, games] as const;
  }));

  return Object.fromEntries(entries) as SectionGames;
}

async function keepLoadableArtwork(
  candidates: readonly MemberCatalogGame[],
  limit: number,
): Promise<MemberCatalogGame[]> {
  const resolved = await Promise.all(candidates.map(async (game) => {
    const image = await resolveLoadableArtwork(game);
    return image ? { ...game, image } : null;
  }));

  return resolved
    .filter((game): game is MemberCatalogGame => Boolean(game))
    .slice(0, limit);
}

function resolveLoadableArtwork(game: MemberCatalogGame) {
  const key = `${game.provider}:${game.providerGameCode || game.id}`.toLowerCase();
  const cached = artworkCache.get(key);
  if (cached) return cached;

  const candidates = [...new Set([game.image, game.imageSource].filter(Boolean))];
  const request = firstLoadableImage(candidates);
  artworkCache.set(key, request);
  return request;
}

async function firstLoadableImage(candidates: readonly string[]) {
  for (const candidate of candidates) {
    if (await imageLoads(candidate)) return candidate;
  }
  return '';
}

function imageLoads(src: string) {
  return new Promise<boolean>((resolve) => {
    if (!src) {
      resolve(false);
      return;
    }

    const image = new Image();
    const timeout = window.setTimeout(() => finish(false), 6_000);
    let settled = false;

    const finish = (loaded: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      resolve(loaded && image.naturalWidth > 1 && image.naturalHeight > 1);
    };

    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    image.decoding = 'async';
    image.src = src;
    if (image.complete) finish(image.naturalWidth > 1 && image.naturalHeight > 1);
  });
}

function syncHighlight(games: MemberCatalogGame[]) {
  const cards = document.querySelectorAll<HTMLAnchorElement>('.source-highlight-game');
  cards.forEach((card, index) => {
    const game = games[index];
    setVisible(card, Boolean(game));
    if (!game) return;
    setLink(card, game);
    setImage(card.querySelector('.source-highlight-game__blur'), game.image, '');
    setImage(card.querySelector('.source-highlight-game__image'), game.image, game.name);
    setImage(card.querySelector('.source-highlight-game__provider img'), game.providerIcon, game.providerName);
    setText(card.querySelector('.source-highlight-game__name'), game.name);
    setText(card.querySelector('.source-highlight-game__rank'), String(index + 1));
    setGameIdentity(card, game);
  });
}

function syncPopular(games: MemberCatalogGame[]) {
  const cards = document.querySelectorAll<HTMLAnchorElement>('.source-popular-card');
  cards.forEach((card, index) => {
    const game = games[index];
    setVisible(card, Boolean(game));
    if (!game) return;
    setLink(card, game);
    card.dataset.gameTags = game.tags.join(',');
    setImage(card.querySelector('.source-popular-card__blur'), game.image, '');
    setImage(card.querySelector('.source-popular-card__image'), game.image, game.name);
    setImage(card.querySelector('.source-popular-card__provider img'), game.providerIcon, game.providerName);
    setText(card.querySelector('.source-popular-card__name'), game.name);
    setText(card.querySelector('.source-popular-card__rank'), String(index + 1));
    setGameIdentity(card, game);
  });
}

function syncOnline(games: MemberCatalogGame[]) {
  const cards = document.querySelectorAll<HTMLAnchorElement>('.source-online-card');
  cards.forEach((card, index) => {
    const game = games[index];
    setVisible(card, Boolean(game));
    if (!game) return;
    setLink(card, game);
    card.dataset.gameTags = game.tags.join(',');
    setImage(card.querySelector('.source-online-card__art img'), game.image, game.name);
    setText(card.querySelector('.source-online-card__counter strong'), game.players.toLocaleString('en-US'));
    setGameIdentity(card, game);
  });
}

function syncClassic(games: MemberCatalogGame[]) {
  const cards = document.querySelectorAll<HTMLAnchorElement>(
    '.reference-compact-section[data-section-kind="classic"] .reference-game-tile',
  );
  cards.forEach((card, index) => {
    const game = games[index];
    setVisible(card, Boolean(game));
    if (!game) return;
    setLink(card, game);
    setImage(card.querySelector('img'), game.image, game.name);
    setText(card.querySelector('strong'), game.name);
    setText(card.querySelector('small'), game.providerName || game.provider.toUpperCase());
    setGameIdentity(card, game);
  });
}

function setGameIdentity(card: HTMLAnchorElement, game: MemberCatalogGame) {
  card.dataset.homeGameSource = 'configured-catalog';
  card.dataset.gameId = game.id;
  card.dataset.gameCode = game.providerGameCode;
  card.dataset.gameName = game.name;
}

function setLink(anchor: HTMLAnchorElement, game: MemberCatalogGame) {
  const href = gameHref(game);
  if (anchor.getAttribute('href') !== href) anchor.setAttribute('href', href);
  if (anchor.title !== game.name) anchor.title = game.name;
}

function setImage(element: Element | null, src: string, alt: string) {
  if (!(element instanceof HTMLImageElement)) return;
  if (src && element.getAttribute('src') !== src) element.src = src;
  if (element.alt !== alt) element.alt = alt;
  if (element.hidden) element.hidden = false;
  if (element.style.display === 'none') element.style.removeProperty('display');
}

function setText(element: Element | null, value: string) {
  if (element && element.textContent !== value) element.textContent = value;
}

function setVisible(element: HTMLElement, visible: boolean) {
  if (element.hidden === visible) element.hidden = !visible;
}

function gameHref(game: MemberCatalogGame) {
  const params = new URLSearchParams({
    category: game.category,
    game: game.providerGameCode || game.id,
    platform: 'pc',
  });
  if (game.provider) params.set('provider', game.provider);
  return `/games?${params.toString()}`;
}
