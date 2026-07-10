# Multilingual and Human-language Backlog

This document is part of the main remaining-work backlog for the Web Member market-style redesign.

## Goal

Build a real multilingual experience for members and admins. All user-facing language must sound natural, direct, and familiar to real people. Avoid robotic, over-formal, generic, or AI-like copy.

## Priority 0: Localization foundation

- [ ] Add a shared i18n system for `web-member` and reusable locale utilities for `web-admin`.
- [ ] Start with Thai as the default language.
- [ ] Add English as the second supported language.
- [ ] Make the locale list configurable for future languages.
- [ ] Store the selected language per member and keep a local fallback for guests.
- [ ] Detect browser language only on first visit and never override an explicit user choice.
- [ ] Add a language switcher in the Member top bar, right sidebar profile card, login, and register pages.
- [ ] Preserve the selected language across login, logout, refresh, and different devices when profile persistence is available.
- [ ] Add a safe fallback chain: selected locale -> Thai -> translation key label.
- [ ] Prevent raw translation keys from appearing in production UI.

## Priority 0: Human language standard

- [ ] Write Thai copy the way normal Thai users speak and read, not as literal machine translation.
- [ ] Use short, direct sentences.
- [ ] Prefer familiar words over technical terms.
- [ ] Avoid unnecessary English when a clear Thai word exists.
- [ ] Never expose raw enum values, API messages, stack traces, database names, or provider error codes directly to members.
- [ ] Translate system status into natural language with a clear next action.
- [ ] Use consistent member terms across all pages.
- [ ] Review every user-facing sentence manually before release.
- [ ] Maintain a glossary and banned-word list.

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
- [ ] Format relative time naturally, such as `เมื่อ 5 นาทีที่แล้ว`.
- [ ] Localize decimal separators and thousands separators.
- [ ] Localize plural and count messages correctly.
- [ ] Localize phone numbers and bank-account display rules where needed.

## Pages that must be fully translated

- [ ] Login
- [ ] Register
- [ ] Member Home
- [ ] Right sidebar and all navigation
- [ ] Wallet card and profile card
- [ ] Promotions and promotion detail
- [ ] Game lobby and game session
- [ ] Deposit
- [ ] Withdraw
- [ ] History and transaction detail
- [ ] Bank accounts
- [ ] Profile
- [ ] Password
- [ ] Sessions
- [ ] Security center
- [ ] Notifications
- [ ] Support and FAQ
- [ ] Empty states
- [ ] Loading states
- [ ] Error states
- [ ] Maintenance pages
- [ ] Public legal and contact pages

## Translation architecture

- [ ] Split locale files by domain rather than one oversized JSON file.
- [ ] Suggested domains: `common`, `auth`, `navigation`, `wallet`, `finance`, `games`, `promotions`, `profile`, `security`, `notifications`, `support`, `errors`.
- [ ] Use stable semantic keys rather than copying whole English sentences as keys.
- [ ] Add type-safe translation keys where practical.
- [ ] Add interpolation for amounts, names, dates, and counts.
- [ ] Add locale-aware validation messages.
- [ ] Add server-error mapping before rendering messages.
- [ ] Keep admin technical details separate from member-friendly messages.

## CMS and promotion content

- [ ] Allow promotion title, description, terms, CTA text, and banner alt text per language.
- [ ] Allow announcement content per language.
- [ ] Allow FAQ question and answer per language.
- [ ] Define fallback behavior when content is missing in the selected language.
- [ ] Show a translation-completeness indicator in Admin.
- [ ] Prevent publishing critical content when the default-language copy is missing.

## Accessibility and layout

- [ ] Ensure layouts support text expansion in English and future languages.
- [ ] Avoid fixed-width buttons that truncate translated labels.
- [ ] Add accessible labels for icons in every locale.
- [ ] Ensure screen-reader text changes with the selected locale.
- [ ] Verify focus order after language switching.
- [ ] Reserve RTL support in the architecture, even if RTL is not enabled initially.

## QA and acceptance criteria

- [ ] No raw translation key is visible anywhere.
- [ ] No raw API or enum message is visible to members.
- [ ] Thai copy reads naturally when reviewed out loud by a Thai speaker.
- [ ] English copy is concise and not a literal Thai translation.
- [ ] Switching language does not reload or lose form state unless technically required.
- [ ] Dates, money, counts, and statuses change correctly with the locale.
- [ ] All main routes pass screenshot checks in Thai and English.
- [ ] Translation coverage is reported in CI or a validation script.
- [ ] Missing translations fail validation for critical routes.
- [ ] Mobile, tablet, and desktop layouts remain usable with both Thai and English text.

## Recommended delivery order

1. Add i18n foundation and locale persistence.
2. Create glossary, terminology rules, and error-message mapper.
3. Translate shared navigation, profile card, wallet card, login, and register.
4. Translate Home, promotions, and game lobby.
5. Translate finance flows and history.
6. Translate profile, security, notifications, and support.
7. Add CMS multilingual fields.
8. Run human copy review and bilingual visual regression.
