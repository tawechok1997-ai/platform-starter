# Reference Asset and Content Settings Inventory

Source package: `noah345-combined-v47-all-mobile-game-pattern (1).rar`

The package contains 810 entries. Reference files are imported as initial defaults only; Admin/Public settings remain authoritative.

## Imported brand and header assets

| Stable project path | Reference source | Settings key |
|---|---|---|
| `/assets/reference-brand/header/noah345-logo.webp` | `assets/header/noah345-logo.webp` | `branding.logo_url` |
| `/assets/reference-brand/header/noah345-logo.webp` | same optimized logo | `branding.logo_mobile_url` |
| `/assets/reference-brand/header/noah345-logo.webp` | same safe initial logo | `branding.logo_login_url` |
| `/assets/reference-brand/header/noah345-logo.webp` | same safe initial logo | `branding.logo_register_url` |
| `/assets/reference-brand/header/noah345-logo.webp` | same safe initial logo | `branding.favicon_url` |
| `/assets/reference-brand/header/th.svg` | `assets/header/th.svg` | `branding.language_icon_url` |

The original logo was normalized to a stable lossless WebP path. Login/Register may later use separate uploaded visuals without changing consumers.

## Imported primary Member menu icons

| Key | Stable project path | Original source |
|---|---|---|
| `home` | `/assets/reference-brand/menu/home.png` | `assets/menu/หน้าเเรก.png` |
| `deposit` | `/assets/reference-brand/menu/deposit.png` | `assets/menu/ฝาก.png` |
| `withdraw` | `/assets/reference-brand/menu/withdraw.png` | `assets/menu/ถอน.png` |
| `promotion` | `/assets/reference-brand/menu/promotion.png` | `assets/menu/โปรโมชัน.png` |
| `bonus` | `/assets/reference-brand/menu/bonus.png` | `assets/menu/โบนัส.png` |
| `affiliate` | `/assets/reference-brand/menu/affiliate.png` | `assets/menu/ลิ้งเเนะนำเพื่อน.png` |
| `support` | `/assets/reference-brand/menu/support.png` | `assets/menu/บริการลูกค้า.png` |
| `history` | `/assets/reference-brand/menu/history.png` | `assets/menu/ประวัตื.png` |
| `notification` | `/assets/reference-brand/menu/notification.png` | `assets/menu/เเจ้งเตอน.png` |
| `activities` | `/assets/reference-brand/menu/activities.png` | `assets/menu/กิจกรรม.png` |
| `news` | `/assets/reference-brand/menu/news.png` | `assets/menu/ข่าวสาร.png` |
| `recommended` | `/assets/reference-brand/menu/recommended.png` | `assets/menu/เเนะนำ.png` |

Primary Member settings keys remain compatible with the existing `icons.home`, `icons.deposit`, `icons.withdraw`, `icons.games`, `icons.promotion`, `icons.bonus`, `icons.affiliate`, `icons.support`, `icons.history`, and `icons.notification` contract. MemberChrome now uses these reference files as defaults while preserving Admin overrides.

## Imported game category navigation icons

| Category | Stable project path | Original source | Settings key |
|---|---|---|---|
| หน้าหลัก | `/assets/reference-brand/menu/home.png` | `assets/menu/หน้าเเรก.png` | `icons.game_category_home_icon` |
| คาสิโน | `/assets/reference-brand/menu/casino.png` | `assets/menu/คาสิโน.png` | `icons.game_category_casino_icon` |
| สล็อต | `/assets/reference-brand/menu/slot.png` | `assets/menu/สล็อต.png` | `icons.game_category_slot_icon` |
| คาสิโนสด | `/assets/reference-brand/menu/live.png` | `assets/menu/ถ่ายทอดสด.png` | `icons.game_category_live_icon` |
| กีฬา | `/assets/reference-brand/menu/sport.png` | `assets/menu/กีฬา.png` | `icons.game_category_sport_icon` |
| ยิงปลา | `/assets/reference-brand/menu/fishing.png` | `assets/menu/ตกปลา.png` | `icons.game_category_fishing_icon` |
| หวย | `/assets/reference-brand/menu/lottery.png` | `assets/menu/หวย.png` | `icons.game_category_lottery_icon` |
| ไพ่ | `/assets/reference-brand/menu/card.png` | `assets/menu/ไพ่.png` | `icons.game_category_card_icon` |
| อาร์เคด | `/assets/reference-brand/menu/activities.png` | `assets/menu/กิจกรรม.png` | `icons.game_category_arcade_icon` |
| เกมใหม่ | `/assets/reference-brand/menu/news.png` | `assets/menu/ข่าวสาร.png` | `icons.game_category_new_icon` |
| ยอดนิยม | `/assets/reference-brand/menu/recommended.png` | `assets/menu/เเนะนำ.png` | `icons.game_category_popular_icon` |
| หมวดอื่น | `/assets/reference-brand/menu/home.png` | safe fallback | `icons.game_category_other_icon` |

The category UI maps aliases returned by the game API, such as `slots`, `live-casino`, `sports`, `fish`, and `lotto`, into these configurable entries. Unknown API categories remain visible through the configurable `other` entry.

## Editable game category labels

- `website.game_category_home_label`
- `website.game_category_casino_label`
- `website.game_category_slot_label`
- `website.game_category_live_label`
- `website.game_category_sport_label`
- `website.game_category_fishing_label`
- `website.game_category_lottery_label`
- `website.game_category_card_label`
- `website.game_category_arcade_label`
- `website.game_category_new_label`
- `website.game_category_popular_label`
- `website.game_category_other_label`

## Important editable content

These values are provided through public settings instead of being owned by individual UI components:

- Site name and description
- Home title and subtitle
- Announcement label and message
- Promotion heading and empty state
- Game heading and empty state
- Provider heading
- Featured, popular, recent and favorite game headings
- Login title and subtitle
- Register title and subtitle
- Deposit, withdraw and support labels
- Game category menu labels
- Primary CTA text
- Footer and support text

General copy currently uses compatible `website.*` settings during the migration. Admin may later present it under a dedicated Content tab without changing the public response shape.

## Home and promotion assets pending controlled intake

The following reference assets are identified but not yet all imported or wired:

- `assets/home/hero-slide-01.jpg`
- `assets/home/hero-slide-02.jpg`
- `assets/home/hero-slide-03.jpg`
- `assets/home/home-strip.png`
- `assets/home/login.webp`
- `assets/home/promo-activity.png`
- `assets/home/promo-news.png`
- `assets/home/tournament-banner-normalized.png`
- `assets/home-source/announcement-megaphone.png`
- `assets/home-source/jackpot.gif`
- `assets/home-source/promo-card-bg.png`
- `assets/home-source/promo-special.png`
- `assets/home/support-headset.webp`

Promotion records and banners must be created in Admin/CMS settings. Reference images may be seeded as initial CMS assets, but Member pages must not hardcode promotion records.

## Integrity and runtime rules

1. `apps/web-member/public/assets/reference-brand/menu/manifest.json` records original path, stable path, and SHA-256 for every imported menu icon.
2. Reference files become initial defaults only.
3. Public/Admin settings override reference defaults.
4. Member UI reads configured values through typed public settings or a compatibility bridge.
5. Game names, provider logos, categories, and game icons continue to come from the game API.
6. Promotion records and banners come from Admin/CMS settings only.
7. Asset URLs and SVG content must pass the existing sanitizers and asset audit.
8. Components retain a safe text/image fallback when a configured asset fails.
9. Layouts remain fluid from 320px through wide desktop displays.
10. Asset audit, test, typecheck, and production build remain required before merge.
