'use client';

import type { GameCategoryNavigationConfig } from '../../brand/game-category-navigation';
import type { SiteIconSettings } from '../../site-settings';
import {
  GameLobbyState,
  GameRail,
  GameRailSkeleton,
} from '../member-home-sections';
import { useMemberHomeData } from '../../hooks/use-member-home-data';
import { GameCategoryNavigation } from './game-category-navigation';
import { HomeCompetitionShowcase } from './home-competition-showcase';

type MemberHomeData = ReturnType<typeof useMemberHomeData>;

export function HomeHighlightsPanel({
  active,
  data,
  primaryColor,
  showCategories,
  showRecommended,
  gamesEnabled,
  gameCategoryNavigation,
  icons,
}: {
  active: boolean;
  data: MemberHomeData;
  primaryColor: string;
  showCategories: boolean;
  showRecommended: boolean;
  gamesEnabled: boolean;
  gameCategoryNavigation: GameCategoryNavigationConfig;
  icons: SiteIconSettings;
}) {
  return (
    <section
      className="member-source-panel member-source-panel--highlights"
      hidden={!active}
      aria-label="ไฮไลท์"
    >
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
        {gamesEnabled && showCategories && (
          <GameCategoryNavigation
            categories={data.categories}
            config={gameCategoryNavigation}
            baseIcons={icons}
          />
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
