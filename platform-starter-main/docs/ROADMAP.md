# ROADMAP

## Main System Backlog

This is the master checklist for systems that should exist before expanding to larger provider, promotion, or production-scale work.

### Finance Core

- Deposit request foundation
- Slip upload and private slip storage
- Admin deposit queue
- Deposit claim / release / timeout job lock
- Deposit approve / reject
- Wallet credit through ledger only
- Withdrawal request foundation
- Withdrawal balance validation
- Withdrawal locked balance
- Admin withdrawal queue
- Withdrawal claim / release / timeout job lock
- Withdrawal approve / reject / success / failed / cancel
- Wallet debit through ledger only
- Refund locked balance on failed or rejected withdrawal
- Manual wallet adjustment with reason
- Ledger explorer with filter and pagination
- Idempotency key for money actions
- Prisma transaction atomicity for every money action

### Bank Account Management

- Admin receiving bank accounts
- Admin receiving QR / payment instructions
- Enable / disable receiving bank accounts
- Min / max amount per bank account
- Member withdrawal bank accounts
- Primary member bank account
- Bank account verification status
- Bank account change audit log

### Operation Center

- Admin dashboard summary
- Deposit queue dashboard
- Withdrawal queue dashboard
- Queue badge / notification count
- Job lock owner display
- Job timeout and auto release
- Admin activity history
- Audit log viewer
- Finance reports
- Export CSV
- Reconciliation report

### Risk and Security

- Risk alert rules
- Duplicate deposit amount alert
- Rapid withdrawal alert
- Bank account changed before withdrawal alert
- Multiple IP / device login alert
- High amount transaction alert
- Rate limit
- Admin IP allowlist
- Device session management
- Session revoke
- Real TOTP 2FA
- Sensitive action dual approval
- Security headers and CSP

### Member and Notification

- Member profile
- Member status: active / suspended / banned
- Member login history
- Member device/session list
- In-app notification center
- Deposit success / rejected notification
- Withdrawal success / rejected notification
- Maintenance notification
- Admin queue notification

### Website Control and Content

- Feature flags for register / login / deposit / withdrawal / promotion / provider
- Maintenance mode by module
- CMS pages
- Legal pages from settings
- Banner management
- Popup announcement
- Sitemap
- Robots.txt
- Dynamic SEO metadata

## Phase 0: Project Foundation

Status: completed

- Monorepo structure
- Member App
- Admin App
- API Backend
- Prisma
- Docker Compose
- Project docs

## Phase 1: Auth, User, Admin

Status: completed core flow, UI polish completed in Phase 3.5

### Member Auth

- Register
- Login
- Refresh token
- Logout
- Forgot password
- Verify phone
- Verify email
- Device tracking
- Login history

### Admin Auth

- Admin login
- 2FA verification
- RBAC
- Permission guard
- IP whitelist
- Session timeout
- Admin audit log

### Auth UX/UI follow-up

- Member login page UI polish
- Member register page UI polish
- Admin login page UI polish
- Auth form validation states
- Loading states during login/register
- Error states with clear Thai messages
- Success states after register/login
- Redirect after member login
- Redirect after admin login
- Mobile responsive auth pages
- Password visibility toggle
- Consistent member branding from Website Settings

### Core Tables

- users
- user_profiles
- admin_users
- roles
- permissions
- admin_user_roles
- role_permissions
- auth_sessions
- login_history
- verification_tokens
- admin_audit_logs

## Phase 2: Website Settings, Wallet, Ledger, Transaction

Status: completed

Full specification: `docs/WEBSITE_SETTINGS.md`
Wallet flow checklist: `docs/P2_WALLET_FLOW.md`

### Website Settings

Admin routes:

- /admin/settings/website
- /admin/settings/branding
- /admin/settings/theme
- /admin/settings/seo
- /admin/settings/contact
- /admin/settings/maintenance
- /admin/settings/scripts
- /admin/settings/features
- /admin/settings/legal

Backend requirements:

- site_settings key-value table
- site_setting_histories table
- Public settings APIs for safe frontend values
- Admin settings APIs
- Audit log for admin changes
- Feature flags for register / login / deposit / withdrawal
- Maintenance mode by module

### Wallet Foundation

- WalletService
- Wallet ledger
- Balance and locked balance
- Member top-up request
- Admin top-up review
- Member withdrawal request
- Admin withdrawal review
- Member transaction history
- Admin ledger explorer
- Admin wallet view
- Short member ID search
- Manual wallet adjustment
- Admin audit log for wallet actions
- Wallet credit / debit / lock / unlock service methods
- Block direct balance edits outside WalletService
- Ledger pagination and filters

### Deposit and Withdrawal Foundation

- Deposit request foundation
- Slip upload
- Admin deposit queue
- Deposit approve / reject
- Credit wallet through ledger on approve
- Withdrawal request foundation
- Validate available balance before withdrawal
- Lock balance on withdrawal request
- Admin withdrawal queue
- Withdrawal approve / reject / success / failed / cancel
- Debit wallet through ledger on withdrawal success
- Unlock or refund locked balance on failed / rejected withdrawal

### Bank Account Foundation

- Admin receiving bank accounts
- Member withdrawal bank accounts
- Primary member bank account
- Bank account verification status
- Audit log for bank account changes

## Phase 3: Wallet Hardening and Operation Center

Status: completed

Closeout: `docs/P3_CLOSEOUT.md`

- Finance dashboard summary: completed
- Reconciliation reports: completed first pass
- Export finance records: completed first pass
- Job lock for high-risk operations: completed first pass
- Private media storage for slips: completed first pass and production guide added
- Notification for review queues: queue summary endpoint completed
- Idempotency key for money actions: completed first pass
- Prisma transaction atomicity for money actions: completed first pass
- Negative balance prevention: completed first pass
- Duplicate request prevention: completed first pass
- Risk alert summary: completed first pass
- Member detail: completed first pass

### ABC hardening pass

- A: top-up review guards, withdrawal review guards, and manual adjustment idempotency from admin UI completed
- B: reports include queue counters, reconciliation checked count, and exports shortcut completed
- C: top-up and withdrawal review UX now removes reviewed pending items and hides duplicate action buttons completed

### Parallel operation pass

- Private Slip Storage: member uploads slips to a private server path and admin loads slips through a guarded endpoint completed first pass
- Queue Badge: admin drawer/topbar now uses /admin/queues/summary completed
- Operation Dashboard: /dashboard aggregates wallet totals, finance queues, recent ledgers, and risk alerts completed first pass
- Activity History: /activity and /admin/operations/history completed first pass
- Member Detail: /member-detail and /admin/members/:id completed first pass
- Risk Summary: /admin/risk/summary completed first pass

## Phase 3.5: UX/UI Polish

Status: completed after production mobile regression test

### Auth Pages

- Member login page final design: completed
- Member register page final design: completed
- Admin login page final design: completed
- Admin OTP/2FA page final design: first pass completed
- Mobile-first form layout: completed
- Clear Thai labels and helper text: completed
- Loading / disabled submit button: completed
- Error alert for wrong credentials: completed
- Error alert for validation failure: completed
- Success feedback after register/login: completed
- Redirect after login: completed
- Password visibility toggle: completed

### Member UX/UI

- Member home layout polish: completed
- Wallet card polish: completed
- Deposit page polish: completed
- Withdraw page polish: completed
- Transactions page polish: completed
- Mobile responsive layout: completed
- Empty states: completed first pass
- Error states: completed first pass
- Shared dark market-style visual direction: completed

### Admin UX/UI

- Admin layout/sidebar: completed
- Operation dashboard first pass: completed
- Finance dashboard polish: completed
- Top-up review page polish: completed
- Withdrawal review page polish: completed
- Wallets page polish: completed
- Ledgers page polish: completed
- Reports page polish: completed
- Activity page first pass: completed
- Member detail page first pass: completed
- Exports page first pass: completed
- Settings hub polish: completed
- Tables, filters, badges, and action buttons: completed first pass
- Better spacing, cards, and typography: completed
- Shared dark market-style visual direction: completed

### Design System

- Button baseline: completed
- Input baseline: completed
- Card baseline: completed
- Badge baseline: completed
- Alert/notice baseline: completed
- Loading/empty state baseline: completed
- Shared colors, radius, spacing, and typography: completed

## Phase 4: Admin Operation Center

Status: next

- Member search and filters
- Member status management
- Member bank account review
- Advanced risk alert rules
- In-app admin notifications
- Queue owner / lock status UI
- Queue timeout / release UI
- Export CSV shortcuts

## Phase 5: Provider and Callback

- Provider adapter
- Game launch
- Callback handling
- HMAC signature
- Idempotency
- Redis lock
- Provider maintenance mode
- Provider balance sync
- Provider transaction retry queue
- Game list and category management
- Provider / game enable-disable controls

## Phase 6: Promotion, Event, VIP, Referral

- Promotion engine
- Coupons
- Events
- VIP levels
- Referral commission
- Banner campaigns
- Popup announcements
- UTM / tracking source
- Promotion claim history
- Promotion turnover rules

## Phase 7: CMS, SEO, Media

- Pages
- Articles
- Banners
- SEO meta
- Sitemap
- Robots.txt
- Dynamic metadata
- Legal pages renderer
- Media library
- Popup announcement
- Footer link management

## Phase 8: Production

- Monitoring
- Backup
- Error logging
- Security review
- Deployment checklist
- Runbook
- Health check endpoint
- Version endpoint
- Request logging
- Rate limit
- Security headers
- CSP
- Database backup policy
- Staging / production separation
- Alert webhook
