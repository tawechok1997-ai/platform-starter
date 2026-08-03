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

export default function DesktopHomeGameSectionRuntime() {
  const { typedSettings } = useSiteSettings();
  const featureSettings = typedSettings.features as Record<string, unknown>;

  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;
    let frame = 0;

    void getMemberGameCatalog('pc').then((catalog) => {
      if (cancelled) return;
      const sections: SectionGames = {
        featured: selectHomeGameSection(catalog, 'featured', 'pc', featureSettings, 8),
        popular: selectHomeGameSection(catalog, 'popular', 'pc', featureSettings, 10),
        online: selectHomeGameSection(catalog, 'online', 'pc', featureSettings, 6),
        classic: selectHomeGameSection(catalog, 'classic', 'pc', featureSettings, 6),
      };
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
      // Existing section fallbacks remain visible when the catalog is unavailable.
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [featureSettings]);

  return null;
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
    card.dataset.homeGameSource = 'configured-catalog';
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
    card.dataset.homeGameSource = 'configured-catalog';
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
    card.dataset.homeGameSource = 'configured-catalog';
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
    card.dataset.homeGameSource = 'configured-catalog';
  });
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
