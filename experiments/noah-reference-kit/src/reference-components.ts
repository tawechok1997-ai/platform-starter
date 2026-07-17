export type ReferenceComponentStatus = "catalogued" | "rebuild-required";

export type ReferenceComponent = {
  name: string;
  status: ReferenceComponentStatus;
};

export const referenceComponents: ReferenceComponent[] = [
  "Bet", "CalendarBox", "CardShortcut", "CircleBGIcon", "ClockIcon",
  "ConditionModal", "Content", "CountDown", "CountdownCard", "CounterUp",
  "Detail", "DetailModal", "DraggableScroll", "EditPincodeIcon", "Event",
  "EventHome", "FilterIcon", "FreeSpace", "Freespace", "GameHit",
  "GameHitSlide", "GameType", "GameUtil", "GiftIcon", "Hamburger",
  "Header", "Home", "ImageMedia", "InformationDetailIcon",
  "InformationLeaderBoardIcon", "InformationRewardIcon", "JackPots",
  "JoinModal", "Layout1", "LeaderBoard", "LeaderboardContent", "Live",
  "LiveService", "LockIcon", "LockIconLevel", "MostOnline", "NavMenu",
  "NoData", "NoDataSearchIcon", "Notify", "Privilege", "Progress",
  "ProviderUtil", "RankBadgeIcon", "RankingButton", "SVG", "SeeAll",
  "SlideImage", "StackIcon", "StackModal", "TabHighLight", "Tournament",
  "TournamentCard", "UserGuide", "UserGuideItem", "VideoPlayer", "Wheel",
  "WinnerCard", "WinnerModal"
].map((name) => ({ name, status: "rebuild-required" }));
