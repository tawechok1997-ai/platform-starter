'use client';

import { useLayoutEffect } from 'react';
import {
  getMemberGameCatalog,
  type MemberCatalogGame,
} from '../../lib/member-game-catalog';

const GAME_ACTION_SELECTOR = '[data-game-id][data-provider-code]';

type CatalogIndex = Map<string, MemberCatalogGame>;

export default function MobileCanonicalGameLaunchCapture() {
  useLayoutEffect(() => {
    let disposed = false;
    const catalogIndex: CatalogIndex = new Map();
    const html = document.documentElement;

    html.dataset.mobileCanonicalLaunchCapture = 'ready';

    void getMemberGameCatalog('mobile')
      .then((items) => {
        if (!disposed) indexCatalog(items, catalogIndex);
      })
      .catch(() => {
        // Data attributes still provide a canonical fallback while the API recovers.
      });

    const handleGameClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const action = event.target.closest<HTMLElement>(GAME_ACTION_SELECTOR);
      if (!action || action.closest('a[href]')) return;

      const gameId = action.dataset.gameId?.trim() ?? '';
      const gameCode = action.dataset.gameCode?.trim() ?? '';
      const catalogGame = findCatalogGame(catalogIndex, gameId, gameCode);
      const provider = catalogGame?.provider
        || normalizeProviderCode(action.dataset.providerCode ?? '');
      const category = catalogGame?.category
        || action.dataset.gameCategory?.trim()
        || 'slot';
      const game = catalogGame?.id || gameId || gameCode;

      if (!provider || !game) return;

      const query = new URLSearchParams({
        category,
        provider,
        game,
        platform: 'mobile',
      });
      const href = `/games?${query.toString()}`;

      event.preventDefault();
      event.stopImmediatePropagation();
      action.dataset.mobileGameLaunch = 'canonical';
      action.dataset.gamePlatform = 'mobile';
      action.dataset.mobileGameLaunchHref = href;
      html.dataset.mobileCanonicalLaunchHref = href;
      window.location.assign(href);
    };

    window.addEventListener('click', handleGameClick, true);
    return () => {
      disposed = true;
      window.removeEventListener('click', handleGameClick, true);
      delete html.dataset.mobileCanonicalLaunchCapture;
      delete html.dataset.mobileCanonicalLaunchHref;
    };
  }, []);

  return null;
}

function indexCatalog(items: MemberCatalogGame[], index: CatalogIndex) {
  items.forEach((item) => {
    for (const key of [item.id, item.providerGameCode]) {
      const normalized = key.trim().toLowerCase();
      if (normalized) index.set(normalized, item);
    }
  });
}

function findCatalogGame(index: CatalogIndex, id: string, code: string) {
  return index.get(id.trim().toLowerCase())
    || index.get(code.trim().toLowerCase())
    || null;
}

function normalizeProviderCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.(?:png|jpe?g|webp|svg)$/i, '')
    .replace(/[^a-z0-9_-]+/g, '');
}
