'use client';

import type { MemberFeatureFlags, SiteIconSettings } from '../../site-settings';
import {
  GameLobbyState,
  GameRail,
  GameRailSkeleton,
} from '../member-home-sections';
import { useMemberHomeData } from '../../hooks/use-member-home-data';
import { HomeCompetitionShowcase } from './home-competition-showcase';
import { HomeQuickActions } from './home-quick-actions';

type MemberHomeData = ReturnType<typeof useMemberHomeData>;

export function HomeHighlightsPanel({
  active,
  data,
  primaryColor,
  showRecommended,
  gamesEnabled,
  icons,
  features,
}: {
  active: boolean;
  data: MemberHomeData;
  primaryColor: string;
  showRecommended: boolean;
  gamesEnabled: boolean;
  icons: SiteIconSettings;
  features: MemberFeatureFlags;
}) {
  return (
    <section
      className="member-source-panel member-source-panel--highlights"
      hidden={!active}
      aria-label="ไฮไลท์"
    >
      <HomeQuickActions icons={icons} features={features} />
      {gamesEnabled && <HomeCompetitionShowcase />}

      <div className="member-source-games">
        {gamesEnabled && data.isGamesLoading && <GameRailSkeleton />}
        {gamesEnabled && !data.isGamesLoading && data.gamesMessage && (
          <GameLobbyState tone="error" message={data.gamesMessage} onRetry={data.reloadGames} />
        )}
        {gamesEnabled &&
          !data.isGamesLoading &&
          !data.gamesMessage &&
          data.featured.length === 0 &&
          data.popular.length === 0 && <GameLobbyState tone="empty" />}
        {gamesEnabled && data.recentGames.length > 0 && (
          <GameRail title="เล่นล่าสุด" href="/games" items={data.recentGames} primaryColor={primaryColor} />
        )}
        {gamesEnabled && showRecommended && (
          <GameRail title="เกมแนะนำ" href="/games" items={data.featured} primaryColor={primaryColor} />
        )}
        {gamesEnabled && data.favoriteGames.length > 0 && (
          <GameRail title="เกมโปรด" href="/games" items={data.favoriteGames} primaryColor={primaryColor} />
        )}
        {gamesEnabled && data.popular.length > 0 && (
          <GameRail title="ยอดนิยม" href="/games" items={data.popular} primaryColor={primaryColor} />
        )}
      </div>
    </section>
  );
}
