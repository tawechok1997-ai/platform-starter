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
- Casino
- Slot
- Fishing
- Sport
- Lottery
- Live

Category reference assets include:

- `assets/casino-mobile/*`
- `assets/fishing/fishing-bg.webp`
- `assets/live/logo_live.webp`
- `assets/lotto/bg_lotto.webp`
- provider and category assets under the corresponding folders

Settings keys:

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
- `icons.casino`
- `icons.slot`
- `icons.fishing`
- `icons.sport`
- `icons.lottery`
- `icons.live`

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
- Primary CTA text
- Footer and support text

Suggested settings namespace: `content`.

## Safety and runtime rules

1. Reference files become initial defaults only.
2. Member UI reads values through public settings.
3. Admin can upload, replace, disable or restore each asset.
4. Game names, provider logos, categories and game icons continue to come from the game API.
5. Promotion records and banners come from Admin/CMS settings.
6. Asset URLs and SVG content must pass existing sanitizers and asset audit.
7. Components must keep a safe text or image fallback when a configured asset fails.
8. All layouts must remain fluid from 320px through wide desktop displays.
