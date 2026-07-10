# Admin Dashboard Redesign Backlog

This document is the authoritative latest backlog for Admin UX/UI, dashboard analytics, navigation, operations surfaces, and visual polish.

When an item here overlaps with older Admin dashboard, sidebar, report, activity, queue, risk, provider-health, or table-polish items in `docs/remaining-work-backlog.md`, this document supersedes the older wording. Keep the latest and more detailed requirement here rather than implementing duplicate versions.

## Product goal

Turn Web Admin into a production-grade operations command center. It should be fast to scan, safe for money operations, visually premium, and useful under pressure. Decorative effects must never reduce readability or hide operational risk.

## Priority 0: Admin shell and navigation

- [ ] Redesign the Admin sidebar into grouped sections: Overview, Money Operations, Members, Games, Growth, and System.
- [ ] Add collapsible sidebar, icon-only mode, persistent state, active indicators, and keyboard-accessible navigation.
- [ ] Add badges for pending deposits, pending withdrawals, unresolved risk alerts, support tickets, provider incidents, and unread operational notifications.
- [ ] Add pinned pages and recently visited pages without duplicating route definitions.
- [ ] Add a top command bar with global search, notifications, system health, environment badge, admin profile, and quick actions.
- [ ] Add a `Ctrl+K` / `Cmd+K` command palette for member search, transaction search, provider navigation, risk alerts, settings, and maintenance actions.
- [ ] Add permission-aware visibility so users do not see actions they cannot perform.
- [ ] Preserve current auth, permission, route-guard, and money-operation behavior during the visual refactor.

## Priority 0: Dashboard information architecture

- [ ] Redesign the dashboard into an executive summary plus operations command center.
- [ ] Add KPI cards for today's deposits, withdrawals, net flow, new members, active members, pending operations, risk alerts, and provider incidents.
- [ ] Show comparison against yesterday, seven days ago, and the rolling 30-day average where data exists.
- [ ] Add clear up/down deltas, percentages, and human-readable explanations.
- [ ] Add timeframe controls for 24 hours, 7 days, 30 days, and custom date range.
- [ ] Add skeleton, empty, partial-error, retry, stale-data, and last-updated states per dashboard section.
- [ ] Allow partial dashboard success when one data source fails instead of failing the entire page.

## Priority 0: Core charts

### Money flow

- [ ] Add line or area chart for deposits, withdrawals, and net flow.
- [ ] Support hourly, daily, and custom date buckets.
- [ ] Add tooltip values, comparison range, and click-through to filtered transactions.
- [ ] Format currency consistently using site currency and locale settings.

### Transaction status

- [ ] Add stacked bar chart for pending, approved, rejected, completed, and failed operations.
- [ ] Separate deposit, withdrawal, and game-transfer views.
- [ ] Allow clicking a segment to open the related filtered queue.

### Provider health

- [ ] Add provider health panel with uptime, latency, error rate, launch success, transfer success, and incident state.
- [ ] Add compact sparklines and traffic-light status.
- [ ] Show degraded and down providers before normal providers.
- [ ] Link each provider row to readiness, incidents, sessions, transfers, and webhook logs.

### Member growth

- [ ] Add trends for new members, active members, returning members, inactive members, registration conversion, and login success/failure.
- [ ] Add filters by date range and member segment where supported.

### Game performance

- [ ] Add charts for launches, active sessions, average session duration, transfer volume, failed launches, top games, and provider distribution.
- [ ] Add drilldown to game, provider, and session detail.

### Risk analytics

- [ ] Add risk heatmap by hour/day, severity, alert type, provider, and member segment.
- [ ] Add failed-login spike, withdrawal anomaly, bank mismatch, rapid money movement, and reconciliation mismatch summaries.
- [ ] Link every risk visualization to the filtered Risk Alert workflow.

## Priority 0: Visual system and glass surfaces

- [ ] Define shared Admin design tokens for surfaces, glass panels, borders, radii, shadows, blur, spacing, typography, and status colors.
- [ ] Use glassmorphism only for KPI cards, chart containers, command surfaces, profile panels, and compact summaries.
- [ ] Do not use transparent glass styling for dense tables, long forms, or detailed audit content.
- [ ] Keep text contrast compliant in dark, dim, light, and high-contrast themes.
- [ ] Add restrained gradients, subtle edge highlights, and depth without excessive glow.
- [ ] Add reduced-motion and reduced-transparency modes.
- [ ] Remove mixed emoji and standardize Admin icons through one shared icon wrapper.

## Priority 1: Tables and saved operational views

- [ ] Create a shared production table system with sticky headers, pagination, sorting, filtering, column visibility, and row density controls.
- [ ] Add column resizing where practical.
- [ ] Add saved filters and saved views per admin account.
- [ ] Add row selection and permission-safe bulk actions.
- [ ] Add expandable rows and reusable right-side detail drawers.
- [ ] Add keyboard navigation and visible focus states.
- [ ] Add export actions with clear limits and server-side filtering.
- [ ] Add predefined views such as deposits waiting over 15 minutes, high-risk withdrawals, provider errors today, repeated failed logins, and stuck transfers.

## Priority 1: Operation queue board

- [ ] Add an optional queue board for deposits, withdrawals, support tickets, risk alerts, and reconciliation cases.
- [ ] Use stages: New, Claimed, Reviewing, Waiting, Completed, and Rejected where applicable.
- [ ] Show operator, priority, SLA timer, risk level, lock state, and conflict state.
- [ ] Add claim/release behavior that prevents two admins from processing the same item.
- [ ] Add drag-and-drop only when the backend validates every transition.
- [ ] Preserve audit logs for all queue changes.

## Priority 1: Live activity and alert center

- [ ] Add a live activity feed for admin actions, member logins, deposits, withdrawals, transfers, provider incidents, risk alerts, and settings changes.
- [ ] Add pause, resume, filtering, severity, auto-scroll, and drilldown controls.
- [ ] Add an alert center with Critical, Warning, Info, Acknowledged, Snoozed, and Resolved states.
- [ ] Add assign, acknowledge, snooze, resolve, incident linking, notes, and audit timeline.
- [ ] Add alerts for API latency, database connectivity, provider health, queue aging, failed-login spikes, webhook signature failures, and reconciliation mismatches.

## Priority 1: Reports and activity consolidation

- [ ] Harden Reports with independent section loading, partial success, retry, custom date ranges, and authenticated export.
- [ ] Add report cards and charts for member growth, promotion usage, game activity, money flow, queue aging, and reconciliation.
- [ ] Harden Activity with request cancellation, stale-response protection, robust error handling, date validation, Enter-to-search, and deep links.
- [ ] Add metadata viewer with collapsible JSON and human-readable labels.
- [ ] Add actor, member, entity, and reference drilldowns.
- [ ] This section supersedes older generic Reports/Activity polish items where requirements overlap.

## Priority 1: Admin profile and preferences

- [ ] Add an admin profile panel with avatar, username, role, permission summary, active session, 2FA state, and last login.
- [ ] Add theme selection: Dark, Dim, Light, and High Contrast.
- [ ] Add density selection: Compact and Comfortable.
- [ ] Add preferences for sidebar width, table density, chart animation, reduced blur, and reduced motion.
- [ ] Persist preferences per admin account where possible.

## Priority 2: Advanced analytics

- [ ] Add registration-to-deposit-to-game funnel analytics.
- [ ] Add member cohort and retention views.
- [ ] Add deposit conversion and withdrawal completion-time analytics.
- [ ] Add queue-aging distribution and SLA breach trends.
- [ ] Add provider latency percentile and error-code distribution.
- [ ] Add promotion claim and turnover performance.
- [ ] Add support SLA and ticket aging analytics.
- [ ] Add fraud/risk score distribution.

## Priority 2: Customizable dashboard

- [ ] Add permission-aware widget visibility.
- [ ] Add dashboard widget ordering and size preferences.
- [ ] Add reset-to-default layout.
- [ ] Do not allow customization to hide mandatory critical alerts or money-operation risk indicators.

## Responsive behavior

- [ ] Desktop uses grouped sidebar, multi-column dashboard, sticky toolbar, and right-side detail drawer.
- [ ] Tablet uses collapsible navigation, two-column summaries, responsive charts, and full-height drawers.
- [ ] Mobile uses simplified navigation, card-based tables, full-screen detail panels, sticky actions, and reduced chart complexity.
- [ ] Validate 390x844, 768x1024, 1024x768, 1280x800, and 1440x900.

## Human-language requirements

- [ ] Admin labels and errors must be clear, concise, and operationally useful.
- [ ] Do not expose raw enums, database field names, stack traces, or provider payload errors as primary UI copy.
- [ ] Translate technical failures into a human summary while preserving sanitized technical detail in an expandable section.
- [ ] Every failed action must explain what happened, whether money changed, and what the admin should do next.
- [ ] Use consistent Thai and English terminology through the shared multilingual system.

## Acceptance criteria

- [ ] The dashboard communicates system, money, member, provider, and risk status within ten seconds of scanning.
- [ ] All charts use real API data, clear units, date ranges, loading states, and drilldowns.
- [ ] Glass effects never reduce readability or hide alerts.
- [ ] No duplicate route, permission, money, provider, or audit logic is introduced for visual convenience.
- [ ] Tables and detail drawers use shared components rather than page-specific copies.
- [ ] Critical operations remain usable with chart APIs unavailable.
- [ ] Dashboard, reports, activity, risk, money queues, and provider operations pass authenticated smoke tests and responsive visual regression.

## Delivery order

1. Admin design tokens, shared icons, and shell/navigation.
2. KPI cards, command bar, and command palette.
3. Money flow, queue health, provider health, and risk summary.
4. Shared table, saved views, and detail drawer system.
5. Reports and Activity hardening.
6. Operation queues, live activity, and alert center.
7. Member growth, game performance, and advanced analytics.
8. Themes, density controls, customization, accessibility, and visual regression.
