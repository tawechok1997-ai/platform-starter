# Website Settings Specification

Website settings are a dedicated admin area and must be clearly separated from financial system settings.

Primary admin route:

```text
/admin/settings/website
```

Settings sections:

```text
/admin/settings
├── website
├── branding
├── seo
├── contact
├── social
├── theme
├── banners
├── maintenance
├── scripts
├── features
└── legal
```

## Core Rules

- Website settings are managed from the admin panel.
- Website settings must be separated from money, wallet, deposit, withdraw, and provider balance settings.
- Every setting update requires admin permission checks.
- Every setting update must write an audit log.
- High-risk setting changes require dual approval.
- Public frontend apps must read only safe public settings through public settings APIs.
- Sensitive settings must never be returned from public APIs.
- Script settings are restricted to Super Admin / Owner only.

## Admin Pages

### Website

Route:

```text
/admin/settings/website
```

Fields:

- site_name
- site_description
- site_url
- admin_url
- default_language
- timezone
- currency
- date_format
- maintenance_mode
- registration_enabled
- login_enabled

Page format:

- Dashboard form
- Save Changes button
- Preview area when applicable

### Branding

Route:

```text
/admin/settings/branding
```

Assets:

- Logo
- Logo Dark
- Logo Light
- Favicon
- App Icon
- Footer Logo
- Loading Logo
- Watermark Logo

Colors:

- Primary Color
- Secondary Color
- Accent Color
- Background Color
- Card Color
- Button Color
- Text Color
- Success Color
- Danger Color
- Warning Color

Example value:

```json
{
  "primaryColor": "#f5c542",
  "backgroundColor": "#080808",
  "cardColor": "#181818",
  "textColor": "#ffffff",
  "successColor": "#22c55e",
  "dangerColor": "#ef4444"
}
```

Branding page must include a preview panel showing logo, balance card, deposit/withdraw buttons, and game card preview.

### Theme / Layout

Route:

```text
/admin/settings/theme
```

Mobile layout:

- Bottom Navigation on/off
- Sticky Wallet on/off
- Floating Deposit Button on/off

Desktop layout:

- Sidebar on/off
- Hero Banner on/off
- Provider Menu on/off

Game layout:

- Grid 2 columns
- Grid 3 columns
- Show HOT badge
- Show NEW badge
- Show Provider name

Member home layout:

- Show Balance Header
- Show Deposit / Withdraw Buttons
- Show Promotion Banner
- Show Game Categories
- Show Popular Providers
- Show Recommended Games

### SEO

Route:

```text
/admin/settings/seo
```

Fields:

- Default Meta Title
- Default Meta Description
- Default Keywords
- Canonical URL
- OG Title
- OG Description
- OG Image
- Twitter Card
- Robots Index
- Robots Follow
- Google Site Verification
- Bing Verification

Actions:

- Generate Sitemap
- Preview SEO
- Validate Slug

Generated files/endpoints:

```text
/sitemap.xml
/robots.txt
```

### Contact / Social

Route:

```text
/admin/settings/contact
```

Contact fields:

- Line OA
- Telegram
- Facebook
- Email
- Phone
- Live Chat URL
- Support Hours
- Company Name
- Address

Social fields:

- Facebook URL
- LINE URL
- Telegram URL
- YouTube URL
- TikTok URL
- X / Twitter URL

Used by:

- Footer
- Contact Page
- Floating Contact Button
- Profile Support Menu

### Maintenance

Route:

```text
/admin/settings/maintenance
```

Settings:

- Maintenance Mode
- Member Maintenance
- Admin Maintenance
- Deposit Maintenance
- Withdraw Maintenance
- Provider Maintenance
- Maintenance Message
- Start Time
- End Time
- Allow Admin Access
- Super Admin only bypass

Maintenance updates must always write audit logs.

### Scripts / Tracking

Route:

```text
/admin/settings/scripts
```

Fields:

- Google Analytics ID
- Google Tag Manager ID
- Facebook Pixel ID
- TikTok Pixel ID
- LINE Tag ID
- Custom Header Script
- Custom Body Script
- Custom Footer Script

Rules:

- Only Super Admin / Owner can update scripts.
- Script values must be sanitized and validated.
- Script changes require audit logs.
- Custom script changes should require dual approval.
- Marketing Staff must not directly publish custom scripts without approval.

### Legal / Policy

Route:

```text
/admin/settings/legal
```

Pages:

- Terms and Conditions
- Privacy Policy
- Cookie Policy
- Responsible Use Policy
- About Us
- Contact Policy

Displayed at:

- /register
- /footer
- /profile
- /pages/terms
- /pages/privacy

### Feature Flags

Route:

```text
/admin/settings/features
```

Feature flags:

- Registration
- Login
- Deposit
- Withdraw
- Promotion
- Event
- VIP
- Referral
- Coupon
- Provider-specific features
- SEO / Articles

Example value:

```json
{
  "registrationEnabled": true,
  "depositEnabled": true,
  "withdrawEnabled": true,
  "promotionEnabled": true,
  "vipEnabled": true,
  "referralEnabled": true
}
```

## Database

Use a flexible key-value table.

### site_settings

```text
id
key
value_json
group
type
is_public
is_sensitive
updated_by
created_at
updated_at
```

Example keys:

```text
website.site_name
website.site_url
branding.logo_url
theme.primary_color
seo.default_title
contact.line_url
maintenance.enabled
features.deposit_enabled
```

### site_setting_histories

```text
id
setting_key
old_value_json
new_value_json
changed_by
ip_address
user_agent
created_at
```

## Public API

Public APIs expose only safe settings.

```text
GET /public/site-settings
GET /public/theme
GET /public/seo
GET /public/contact
```

Public APIs must not expose sensitive settings.

## Admin API

```text
GET  /admin/settings/website
PUT  /admin/settings/website
GET  /admin/settings/branding
PUT  /admin/settings/branding
GET  /admin/settings/theme
PUT  /admin/settings/theme
GET  /admin/settings/seo
PUT  /admin/settings/seo
GET  /admin/settings/contact
PUT  /admin/settings/contact
GET  /admin/settings/maintenance
PUT  /admin/settings/maintenance
GET  /admin/settings/scripts
PUT  /admin/settings/scripts
GET  /admin/settings/features
PUT  /admin/settings/features
GET  /admin/settings/legal
PUT  /admin/settings/legal
```

## Permissions

```text
settings.website.view
settings.website.update
settings.branding.view
settings.branding.update
settings.theme.view
settings.theme.update
settings.seo.view
settings.seo.update
settings.contact.view
settings.contact.update
settings.maintenance.view
settings.maintenance.update
settings.scripts.view
settings.scripts.update
settings.features.view
settings.features.update
settings.legal.view
settings.legal.update
```

## Dual Approval Required

Dual approval is required for:

- Enable/disable deposit
- Enable/disable withdraw
- Enable full-site maintenance
- Update custom scripts
- Update domain settings
- Update provider feature flags
- Enable/disable registration

## Backend Structure

```text
apps/api/src/modules/settings/
├── settings.module.ts
├── settings.controller.ts
├── settings.service.ts
├── settings.repository.ts
├── dto/
│   ├── update-website-settings.dto.ts
│   ├── update-branding-settings.dto.ts
│   ├── update-theme-settings.dto.ts
│   ├── update-seo-settings.dto.ts
│   ├── update-contact-settings.dto.ts
│   ├── update-maintenance-settings.dto.ts
│   ├── update-scripts-settings.dto.ts
│   ├── update-features-settings.dto.ts
│   └── update-legal-settings.dto.ts
├── services/
│   ├── public-settings.service.ts
│   ├── settings-cache.service.ts
│   ├── settings-history.service.ts
│   └── settings-validation.service.ts
└── enums/
    ├── setting-group.enum.ts
    └── setting-type.enum.ts
```

## Cache Keys

Use Redis cache keys:

```text
site_settings:public
site_settings:theme
site_settings:seo
site_settings:maintenance
site_settings:features
```

## Save Flow

```text
Validate permission
↓
Validate payload
↓
Check dual approval requirement
↓
Update database
↓
Write setting history
↓
Write admin audit log
↓
Clear cache
↓
Broadcast realtime event
↓
Frontend reloads settings
```

## Frontend Admin Structure

```text
apps/web-admin/app/(admin)/settings/
├── page.tsx
├── website/page.tsx
├── branding/page.tsx
├── theme/page.tsx
├── seo/page.tsx
├── contact/page.tsx
├── maintenance/page.tsx
├── scripts/page.tsx
├── features/page.tsx
└── legal/page.tsx
```

Admin settings menu:

- Website
- Branding
- Theme
- SEO
- Contact
- Maintenance
- Scripts
- Feature Flags
- Legal Pages
- Security

## Implementation Order

1. Database models: site_settings and site_setting_histories
2. Settings permissions seed
3. Settings backend module
4. Public settings APIs
5. Admin settings APIs
6. Admin website settings page
7. Admin branding/theme/seo/contact pages
8. Maintenance and feature flags
9. Scripts with strict permission and dual approval
10. Legal settings
11. Frontend public settings loader
