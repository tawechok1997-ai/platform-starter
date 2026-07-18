# Member Feature Map

This map translates archived component names into repository-owned Member feature areas. It does not authorize production integration.

| Member feature | Reference components | Intended owned implementation |
|---|---|---|
| Application shell | Header, Content, Layout1, FreeSpace | Member shell, content frame, safe-area spacing |
| Primary navigation | NavMenu, Hamburger, CardShortcut, SeeAll | Responsive member navigation and shortcuts |
| Promotions and highlights | SlideImage, ImageMedia, TabHighLight, EventHome | Promotion carousel, highlight tabs, campaign cards |
| Game discovery | GameType, GameHit, GameHitSlide, MostOnline | Category tabs, popular games, discovery rails |
| Provider browsing | ProviderUtil, GameUtil | Provider filters and normalized game metadata |
| Live content | Live, LiveService, VideoPlayer | Live game/service cards and optional media preview |
| Tournament discovery | Tournament, TournamentCard, CountDown, CountdownCard | Tournament list, status, countdown and details |
| Tournament participation | JoinModal, ConditionModal, DetailModal | Repository-owned eligibility and confirmation flows |
| Leaderboard | LeaderBoard, LeaderboardContent, RankingButton, RankBadgeIcon | Ranking list, user rank and period selectors |
| Winner and jackpot | WinnerCard, WinnerModal, JackPots | Public winner display and jackpot summaries |
| Privilege and rewards | Privilege, GiftIcon, Progress, LockIconLevel | Tier status, rewards, eligibility and locked states |
| Reward interactions | Wheel, StackModal, StackIcon | Optional reward interaction mocks only |
| Notifications | Notify | Member notification surface using project contracts |
| Empty and feedback states | NoData, NoDataSearchIcon, Detail | Empty, search-empty and informational states |
| User guidance | UserGuide, UserGuideItem | Help steps and onboarding content |
| Generic utilities | DraggableScroll, CounterUp, CalendarBox, FilterIcon | Shared behavior implemented with repository standards |

## Existing production systems that remain authoritative

The following areas must continue to use current repository implementations and contracts:

- Authentication and session management
- Wallet balance and ledger
- Deposit and withdrawal
- Promotion settlement and bonus eligibility
- KYC and risk controls
- Notification persistence and preferences
- Support tickets and attachments
- Provider readiness and game-launch contracts

Reference components may change presentation only after a separate integration review. They may not replace domain logic.
