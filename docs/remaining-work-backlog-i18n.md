# Multilingual and Human-language Backlog

This document is part of the main remaining-work backlog for both Web Member and Web Admin.

## Goal

Build a real multilingual experience for members and admins. All user-facing language must sound natural, direct, and familiar to real people. Avoid robotic, over-formal, generic, or AI-like copy.

Thai and English are mandatory first-class languages across both applications. Neither application may be considered complete while one language is only partially implemented.

## Priority 0: Localization foundation

- [ ] Add one shared i18n architecture for `web-member` and `web-admin`.
- [ ] Start with Thai as the default language.
- [ ] Add English as the second mandatory language.
- [ ] Make the locale list configurable for future languages.
- [ ] Store the selected language per member and per admin account, with a local fallback for guests or pre-login screens.
- [ ] Detect browser language only on first visit and never override an explicit user choice.
- [ ] Add a language switcher in Member login, register, top bar, profile/wallet area, and account settings.
- [ ] Add a language switcher in Admin login, command bar, admin profile, and preferences.
- [ ] Preserve the selected language across login, logout, refresh, session renewal, and different devices when account persistence is available.
- [ ] Add a safe fallback chain: selected locale -> Thai -> safe human-readable fallback.
- [ ] Prevent raw translation keys from appearing in production UI.
- [ ] Keep translation keys shared where meaning is truly shared, but separate Member and Admin wording where audience or responsibility differs.

## Priority 0: Full application coverage

### Web Member

- [ ] Translate every route, modal, drawer, toast, validation message, empty state, loading state, error state, and maintenance state.
- [ ] Translate login, register, Member Home, navigation, wallet/profile cards, promotions, games, deposit, withdraw, history, bank accounts, profile, password, sessions, security, notifications, support, FAQ, legal, and contact pages.
- [ ] Translate member-facing API errors into natural language with a clear next action.
- [ ] Never expose provider codes, raw enums, database values, or technical failure messages to members.

### Web Admin

- [ ] Translate every route, dashboard widget, chart label, table column, filter, saved view, command palette item, modal, drawer, toast, validation message, error state, and audit label.
- [ ] Translate Dashboard, Activity, Reports, Members, Deposits, Withdrawals, Wallets, Ledgers, Game Transfers, Providers, Games, Sessions, Webhooks, Risk, Reconciliation, Promotions, CMS, Support, Settings, Security, Roles, Permissions, Admin Accounts, and Audit Logs.
- [ ] Keep technical details available to admins in a separate expandable section while the primary summary remains natural and operationally useful.
- [ ] Translate permission names and role descriptions without weakening the exact permission model.

## Priority 0: Human language standard

- [ ] Write Thai copy the way normal Thai users speak and read, not as literal machine translation.
- [ ] Write English copy naturally, not as a word-for-word translation from Thai.
- [ ] Use short, direct sentences.
- [ ] Prefer familiar words over technical terms.
- [ ] Avoid unnecessary English in Thai when a clear Thai word exists.
- [ ] Never expose raw enum values, API messages, stack traces, database names, or provider error codes as primary UI copy.
- [ ] Translate system status into natural language with a clear next action.
- [ ] Use consistent terminology across all pages.
- [ ] Review every user-facing sentence manually before release.
- [ ] Maintain a glossary, approved terminology list, and banned robotic-copy list.

## Required Thai terminology

Use these terms consistently:

- `ฝาก`
- `ถอนเงิน`
- `ประวัติ`
- `บัญชีธนาคาร`
- `ยอดพร้อมใช้`
- `ยอดที่ถูกล็อก`
- `ช่องทาง`
- `หมายเหตุ`
- `การแจ้งเตือน`
- `ศูนย์ช่วยเหลือ`
- `เกมโปรด`
- `เล่นล่าสุด`
- `กำลังตรวจสอบ`
- `สำเร็จ`
- `ไม่สำเร็จ`
- `ปิดปรับปรุงชั่วคราว`

Avoid member-facing terms such as:

- `Wallet`
- `Locked`
- `Balance`
- `Method`
- `Admin note`
- `Transaction`
- raw values such as `PENDING_REVIEW`, `APPROVED`, `REJECTED`, or `FAILED`

## Natural-copy examples

Use:

- `กำลังตรวจสอบรายการของคุณ`
- `เราได้รับคำขอแล้ว จะแจ้งให้ทราบเมื่อดำเนินการเสร็จ`
- `ยอดเงินไม่พอสำหรับรายการนี้`
- `เลือกบัญชีธนาคารก่อนถอนเงิน`
- `เชื่อมต่อระบบไม่สำเร็จ ลองอีกครั้งได้เลย`
- `เกมนี้ปิดปรับปรุงชั่วคราว`

Do not use:

- `Your request is being processed by the system`
- `An unexpected error has occurred`
- `Please contact administrator`
- `Invalid payload`
- `Operation failed`
- Thai sentences that are obviously translated word-for-word from English

## Locale-aware formatting

- [ ] Format currency using the selected locale and configured currency.
- [ ] Format dates and times using the selected locale and site timezone.
- [ ] Support Thai Buddhist year only where product requirements explicitly call for it.
- [ ] Format relative time naturally, such as `เมื่อ 5 นาทีที่แล้ว` or `5 minutes ago`.
- [ ] Localize decimal separators and thousands separators.
- [ ] Localize plural and count messages correctly.
- [ ] Localize phone numbers and bank-account display rules where needed.
- [ ] Localize chart axes, tooltips, legends, export labels, and table summaries in Admin.

## Translation architecture

- [ ] Split locale files by domain rather than one oversized JSON file.
- [ ] Suggested domains: `common`, `auth`, `navigation`, `wallet`, `finance`, `games`, `promotions`, `profile`, `security`, `notifications`, `support`, `errors`, `admin-dashboard`, `admin-operations`, `admin-risk`, `admin-settings`, `roles`, `permissions`, and `audit`.
- [ ] Use stable semantic keys rather than copying whole English sentences as keys.
- [ ] Add type-safe translation keys where practical.
- [ ] Add interpolation for amounts, names, dates, counts, roles, and permission scopes.
- [ ] Add locale-aware validation messages.
- [ ] Add server-error mapping before rendering messages.
- [ ] Keep admin technical details separate from member-friendly messages.
- [ ] Add a script that detects missing or unused translation keys.

## CMS and multilingual content

- [ ] Allow promotion title, description, terms, CTA text, and banner alt text per language.
- [ ] Allow announcement content per language.
- [ ] Allow FAQ question and answer per language.
- [ ] Allow legal documents, maintenance messages, navigation labels, and support content per language.
- [ ] Define fallback behavior when content is missing in the selected language.
- [ ] Show a translation-completeness indicator in Admin.
- [ ] Prevent publishing critical content when the default-language copy is missing.
- [ ] Allow draft and publish state per language where appropriate.

## Accessibility and layout

- [ ] Ensure layouts support text expansion in Thai and English.
- [ ] Avoid fixed-width buttons that truncate translated labels.
- [ ] Add accessible labels for icons in every locale.
- [ ] Ensure screen-reader text changes with the selected locale.
- [ ] Verify focus order after language switching.
- [ ] Reserve RTL support in the architecture, even if RTL is not enabled initially.
- [ ] Verify both languages on Desktop, Tablet, and Mobile for both applications.

## QA and acceptance criteria

- [ ] No raw translation key is visible anywhere.
- [ ] No raw API or enum message is visible to members.
- [ ] Thai copy reads naturally when reviewed out loud by a Thai speaker.
- [ ] English copy is concise and not a literal Thai translation.
- [ ] Switching language does not reload or lose form state unless technically required.
- [ ] Dates, money, counts, statuses, charts, filters, and permissions display correctly with the locale.
- [ ] All Member and Admin routes pass screenshot checks in Thai and English.
- [ ] Translation coverage is reported in CI or a validation script.
- [ ] Missing translations fail validation for critical routes.
- [ ] Desktop, Tablet, and Mobile layouts remain usable with both Thai and English text.
- [ ] Both applications reach 100% translation coverage for all production-visible copy before release.

## Recommended delivery order

1. Add shared i18n foundation and locale persistence for both applications.
2. Create glossary, terminology rules, and error-message mapper.
3. Translate shared navigation, authentication, profiles, and settings.
4. Translate all Web Member flows.
5. Translate all Web Admin routes, tables, dashboards, charts, and permissions.
6. Add CMS multilingual fields.
7. Add translation validation in CI.
8. Run human copy review and bilingual visual regression on Desktop, Tablet, and Mobile.