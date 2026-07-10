# Backlog Source of Truth

This file defines which backlog document is authoritative when requirements overlap.

## Precedence rule

- The newest, most detailed domain document always supersedes older or shorter wording for the same work.
- Duplicate work must be implemented once only.
- Do not merge two overlapping implementations.
- Preserve any non-overlapping safety, business, audit, or QA requirement from older documents.
- When a conflict remains, follow the document listed as authoritative below.

## Authoritative backlog by domain

### Web Member UX/UI

Authoritative source:

- `docs/remaining-work-backlog.md` section `Main initiative: Web Member market-style redesign`

This supersedes older generic Member Home, Game Lobby, navigation, promotions, wallet-card, profile-card, icon, and responsive-polish wording where they overlap.

### Authentication UX for both websites

Authoritative source:

- `docs/remaining-work-backlog-auth-ux.md`

This applies to `web-member` and `web-admin` and supersedes older login, register, invitation activation, password setup, password recovery, authentication layout, and onboarding presentation wording where they overlap. Member registration uses a secure multi-step flow. Admin has no public self-registration and uses an invitation-based multi-step activation flow controlled by the Owner or an explicitly delegated admin.

### Bilingual Thai and English

Authoritative source:

- `docs/remaining-work-backlog-i18n.md`

This applies to both `web-member` and `web-admin` and supersedes older partial Thai-only, generic translation, label, error-copy, and locale requirements.

### Web Admin dashboard, navigation, charts, tables, and responsive UX

Authoritative source:

- `docs/remaining-work-backlog-admin-dashboard.md`

This supersedes older Admin dashboard, sidebar, Reports, Activity, queue-board, provider-health, risk-visualization, table-polish, glass-surface, chart, desktop, tablet, and mobile wording where they overlap.

### Security, Owner, admin accounts, roles, permissions, delegated access, sessions, and anti-bot

Authoritative source:

- `docs/remaining-work-backlog-security-admin-access.md`

This supersedes older security, RBAC, permission, admin-account, invitation, 2FA, session, audit, CAPTCHA, anti-bot, rate-limit, bot-detection, and delegated-access wording where they overlap.

### Provider, money operations, reconciliation, webhooks, and backend verification

Authoritative source:

- `docs/remaining-work-backlog.md`

Use the detailed backend, provider, money-operation, reconciliation, webhook, and QA sections that are not superseded by the domain documents above.

## Duplicate handling

When the same task appears in more than one file:

1. Keep the newest authoritative wording.
2. Carry forward older requirements only when they add a unique safety, audit, business, accessibility, localization, or QA constraint.
3. Do not create duplicate routes, components, APIs, database fields, permission codes, or tests.
4. Mark the older item as superseded during implementation or backlog cleanup.
5. Link the implementation commit to the authoritative item only.

## Current canonical set

- `docs/backlog-source-of-truth.md`
- `docs/remaining-work-backlog.md`
- `docs/remaining-work-backlog-auth-ux.md`
- `docs/remaining-work-backlog-i18n.md`
- `docs/remaining-work-backlog-admin-dashboard.md`
- `docs/remaining-work-backlog-security-admin-access.md`

Any future backlog document must either extend one of these domains or explicitly declare which existing document it supersedes. Do not create another parallel master list.
