# Reference Asset and Content Settings Inventory

Source package: `noah345-combined-v47-all-mobile-game-pattern (1).rar`

The package contains 810 entries. Important assets identified for the first settings-backed migration are listed below.

## Brand and header

- `assets/header/noah345-logo.png`
- `assets/header/th.svg`

Settings keys:

- `branding.logo_url`
- `branding.logo_mobile_url`
- `branding.logo_login_url`
- `branding.logo_register_url`
- `branding.favicon_url`
- `branding.language_icon_url`

## Home and promotion presentation

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

Settings keys:

- `branding.home_strip_url`
- `branding.login_visual_url`
- `branding.announcement_icon_url`
- `branding.jackpot_image_url`
- `branding.promotion_card_background_url`
- `branding.support_icon_url`
- CMS banner and promotion records under Admin settings

## Menu and important icons

All primary Member navigation icons must be editable through settings:

- Home
- Deposit
- Withdraw
- Games
- Promotion
- Bonus
- Affiliate
- Support
- History
- Bank
- Profile
- Notification
- VIP
- Wallet

Reference source files under `assets/menu/` include Thai-named originals such as `หน้าเเรก.png`, `คาสิโน.png`, `สล็อต.png`, `กีฬา.png`, `ตกปลา.png`, `ถ่ายทอดสด.png`, `หวย.png`, and `ไพ่.png`. During intake they are renamed to stable English filenames under `public/assets/reference-brand/menu/`.

Primary settings keys:

- `icons.home`
- `icons.deposit`
- `icons.withdraw`
- `icons.games`
- `icons.promotion`
- `icons.bonus`
- `icons.affiliate`
- `icons.support`
- `icons.history`
- `icons.bank`
- `icons.profile`
- `icons.notification`
- `icons.vip`
- `icons.wallet`

## Game category navigation icons and labels

The category rail shown on Member Home and the game lobby must read both label and icon values from settings. It covers:

- หน้าหลัก
- คาสิโน
- สล็อต
- คาสิโนสด
- กีฬา
- ยิงปลา
- หวย
- ไพ่
- อาร์เคด
- เกมใหม่
- ยอดนิยม
- หมวดอื่นจาก API

Icon settings keys:

- `icons.game_category_home_icon`
- `icons.game_category_casino_icon`
- `icons.game_category_slot_icon`
- `icons.game_category_live_icon`
- `icons.game_category_sport_icon`
- `icons.game_category_fishing_icon`
- `icons.game_category_lottery_icon`
- `icons.game_category_card_icon`
- `icons.game_category_arcade_icon`
- `icons.game_category_new_icon`
- `icons.game_category_popular_icon`
- `icons.game_category_other_icon`

Label settings keys:

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

The UI maps aliases returned by the game API, such as `slots`, `live_casino`, `sports`, `fish`, and `lotto`, into these configurable entries. Unknown API categories remain visible using the configurable `other` fallback.

## Important editable content

Text must be provided by settings rather than embedded inside UI components:

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

Suggested settings namespace: `content` for general copy, while existing public settings compatibility keeps game category labels under `website` until the Admin migration is complete.

## Safety and runtime rules

1. Reference files become initial defaults only.
2. Member UI reads values through public settings.
3. Admin can upload, replace, disable or restore each asset.
4. Game names, provider logos, categories and game icons continue to come from the game API.
5. Promotion records and banners come from Admin/CMS settings only.
6. Asset URLs and SVG content must pass existing sanitizers and asset audit.
7. Components must keep a safe text or image fallback when a configured asset fails.
8. All layouts must remain fluid from 320px through wide desktop displays.
