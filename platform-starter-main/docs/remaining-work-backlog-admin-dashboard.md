# Admin Dashboard Redesign Backlog

This document is the authoritative latest backlog for Admin UX/UI, dashboard analytics, navigation, operations surfaces, and visual polish.

When an item here overlaps with older Admin dashboard, sidebar, report, activity, queue, risk, provider-health, or table-polish items in `docs/remaining-work-backlog.md`, this document supersedes the older wording. Keep the latest and more detailed requirement here rather than implementing duplicate versions.

## Product goal

Turn Web Admin into a production-grade operations command center. It should be fast to scan, safe for money operations, visually premium, and useful under pressure. Decorative effects must never reduce readability or hide operational risk.

## Platform requirement: Desktop, tablet, and mobile

- [ ] Build dedicated Desktop, Tablet, and Mobile experiences from the same API, permissions, and business logic.
- [ ] Do not treat mobile as a shrunken desktop layout.
- [ ] Keep feature parity for critical operations across all device classes.
- [ ] Allow layout, navigation, table presentation, chart density, and action placement to differ by device.
- [ ] Preserve safe-area support, touch targets of at least 44px, keyboard access on desktop, and screen-reader labels everywhere.
- [ ] Critical actions must remain reachable and understandable without horizontal scrolling.

## Priority 0: Admin shell and navigation

- [ ] Redesign the Admin sidebar into grouped sections: Overview, Money Operations, Members, Games, Growth, and System.
- [ ] Add collapsible sidebar, icon-only mode, persistent state, active indicators, and keyboard-accessible navigation.
- [ ] Add badges for pending deposits, pending withdrawals, unresolved risk alerts, support tickets, provider incidents, and unread operational notifications.
- [ ] Add pinned pages and recently visited pages without duplicating route definitions.
- [ ] Add a top command bar with global search, notifications, system health, environment badge, admin profile, and quick actions.
- [ ] Add a `Ctrl+K` / `Cmd+K` command palette for member search, transaction search, provider navigation, risk alerts, settings, and maintenance actions.
- [ ] Add permission-aware visibility so users do not see actions they cannot perform.
- [ ] Preserve current auth, permission, route-guard, and money-operation behavior during the visual refactor.
- [ ] Add a dedicated mobile navigation pattern using bottom navigation, compact header actions, and full-screen menu/search surfaces.
- [ ] Add a tablet navigation pattern that can collapse without covering operational content.

## Priority 0: Dashboard information architecture

- [ ] Redesign the dashboard into an executive summary plus operations command center.
- [ ] Add KPI cards for today's deposits, withdrawals, net flow, new members, active members, pending operations, risk alerts, and provider incidents.
- [ ] Show comparison against yesterday, seven days ago, and the rolling 30-day average where data exists.
- [ ] Add clear up/down deltas, percentages, and human-readable explanations.
- [ ] Add timeframe controls for 24 hours, 7 days, 30 days, and custom date range.
- [ ] Add skeleton, empty, partial-error, retry, stale-data, and last-updated states per dashboard section.
- [ ] Allow partial dashboard success when one data source fails instead of failing the entire page.
- [ ] Use multi-column composition on desktop, two-column composition on tablet, and prioritized single-column cards on mobile.
- [ ] Keep urgent queues, critical alerts, and money-operation status above the fold on mobile.

## Priority 0: Core charts

### Money flow

- [ ] Add line or area chart for deposits, withdrawals, and net flow.
- [ ] Support hourly, daily, and custom date buckets.
- [ ] Add tooltip values, comparison range, and click-through to filtered transactions.
- [ ] Format currency consistently using site currency and locale settings.
- [ ] Provide a mobile chart mode with simplified legends, readable labels, touch tooltips, and summary values outside the chart.

### Transaction status

- [ ] Add stacked bar chart for pending, approved, rejected, completed, and failed operations.
- [ ] Separate deposit, withdrawal, and game-transfer views.
- [ ] Allow clicking a segment to open the related filtered queue.
- [ ] Provide a mobile fallback using compact bars or ranked status cards when the full chart becomes unreadable.

### Provider health

- [ ] Add provider health panel with uptime, latency, error rate, launch success, transfer success, and incident state.
- [ ] Add compact sparklines and traffic-light status.
- [ ] Show degraded and down providers before normal providers.
- [ ] Link each provider row to readiness, incidents, sessions, transfers, and webhook logs.
- [ ] Use a card list on mobile with critical metrics visible before opening detail.

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
- [ ] Provide a mobile risk-summary mode that never depends on a dense heatmap alone.

## Priority 0: Visual system and glass surfaces

- [ ] Define shared Admin design tokens for surfaces, glass panels, borders, radii, shadows, blur, spacing, typography, and status colors.
- [ ] Use glassmorphism only for KPI cards, chart containers, command surfaces, profile panels, and compact summaries.
- [ ] Do not use transparent glass styling for dense tables, long forms, or detailed audit content.
- [ ] Keep text contrast compliant in dark, dim, light, and high-contrast themes.
- [ ] Add restrained gradients, subtle edge highlights, and depth without excessive glow.
- [ ] Add reduced-motion and reduced-transparency modes.
- [ ] Remove mixed emoji and standardize Admin icons through one shared icon wrapper.
- [ ] Ensure blur, glow, and transparency are reduced automatically on low-power or mobile presentation modes where necessary.

## Priority 1: Tables and saved operational views

- [ ] Create a shared production table system with sticky headers, pagination, sorting, filtering, column visibility, and row density controls.
- [ ] Add column resizing where practical.
- [ ] Add saved filters and saved views per admin account.
- [ ] Add row selection and permission-safe bulk actions.
- [ ] Add expandable rows and reusable right-side detail drawers.
- [ ] Add keyboard navigation and visible focus states.
- [ ] Add export actions with clear limits and server-side filtering.
- [ ] Add predefined views such as deposits waiting over 15 minutes, high-risk withdrawals, provider errors today, repeated failed logins, and stuck transfers.
- [ ] Render dense tables on desktop, compact tables or split panes on tablet, and card-based record lists on mobile.
- [ ] Move row actions into a mobile-safe action sheet instead of shrinking multiple buttons into one row.
- [ ] Keep bulk actions available on mobile through explicit selection mode and sticky action bars.

## Priority 1: Operation queue board

- [ ] Add an optional queue board for deposits, withdrawals, support tickets, risk alerts, and reconciliation cases.
- [ ] Use stages: New, Claimed, Reviewing, Waiting, Completed, and Rejected where applicable.
- [ ] Show operator, priority, SLA timer, risk level, lock state, and conflict state.
- [ ] Add claim/release behavior that prevents two admins from processing the same item.
- [ ] Add drag-and-drop only when the backend validates every transition.
- [ ] Preserve audit logs for all queue changes.
- [ ] Use horizontal board columns on desktop and stage tabs with stacked cards on mobile.

## Priority 1: Live activity and alert center

- [ ] Add a live activity feed for admin actions, member logins, deposits, withdrawals, transfers, provider incidents, risk alerts, and settings changes.
- [ ] Add pause, resume, filtering, severity, auto-scroll, and drilldown controls.
- [ ] Add an alert center with Critical, Warning, Info, Acknowledged, Snoozed, and Resolved states.
- [ ] Add assign, acknowledge, snooze, resolve, incident linking, notes, and audit timeline.
- [ ] Add alerts for API latency, database connectivity, provider health, queue aging, failed-login spikes, webhook signature failures, and reconciliation mismatches.
- [ ] Add mobile push-style cards and a full-screen alert detail flow.

## Priority 1: Reports and activity consolidation

- [ ] Harden Reports with independent section loading, partial success, retry, custom date ranges, and authenticated export.
- [ ] Add report cards and charts for member growth, promotion usage, game activity, money flow, queue aging, and reconciliation.
- [ ] Harden Activity with request cancellation, stale-response protection, robust error handling, date validation, Enter-to-search, and deep links.
- [ ] Add metadata viewer with collapsible JSON and human-readable labels.
- [ ] Add actor, member, entity, and reference drilldowns.
- [ ] This section supersedes older generic Reports/Activity polish items where requirements overlap.
- [ ] Provide mobile report summaries before detailed charts and tables.
- [ ] Use full-screen filters and full-screen detail panels on mobile.

## Priority 1: Admin profile and preferences

- [ ] Add an admin profile panel with avatar, username, role, permission summary, active session, 2FA state, and last login.
- [ ] Add theme selection: Dark, Dim, Light, and High Contrast.
- [ ] Add density selection: Compact and Comfortable.
- [ ] Add preferences for sidebar width, table density, chart animation, reduced blur, and reduced motion.
- [ ] Persist preferences per admin account where possible.
- [ ] Add separate mobile preferences for compact chart mode, sticky actions, and reduced data density.

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
- [ ] Store separate widget ordering for desktop and mobile when layouts differ.

## Responsive behavior

### Desktop

- [ ] Use grouped sidebar, multi-column dashboard, sticky toolbar, dense tables, split panes, right-side detail drawers, hover affordances, and keyboard shortcuts.
- [ ] Support 1280x800, 1366x768, 1440x900, and wider screens without excessively stretched content.
- [ ] Keep high-density operational views readable through max-widths, columns, and resizable panels.

### Tablet

- [ ] Use collapsible navigation, two-column summaries, responsive charts, full-height drawers, and touch-friendly controls.
- [ ] Validate portrait and landscape behavior at 768x1024 and 1024x768.
- [ ] Avoid desktop hover-only interactions.

### Mobile

- [ ] Use bottom navigation or compact top navigation, single-column dashboard cards, card-based record lists, full-screen detail panels, sticky action bars, and touch-safe filters.
- [ ] Reduce chart complexity without removing critical meaning.
- [ ] Use action sheets for record actions and full-screen forms for high-risk operations.
- [ ] Preserve safe areas on iPhone and Android devices.
- [ ] Validate 360x800, 390x844, and 430x932.
- [ ] Ensure no critical page requires horizontal scrolling.

### Responsive QA

- [ ] Create authenticated visual regression snapshots for dashboard, reports, activity, risk, deposits, withdrawals, wallets, ledgers, providers, games, support, settings, and alert center.
- [ ] Test loading, empty, partial-error, stale-data, long-text, long-number, permission-hidden, and maintenance states on every device class.
- [ ] Test charts with zero data, one data point, dense data, and very large values.
- [ ] Test mobile keyboard, landscape mode, browser zoom, and screen-reader navigation.

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
- [ ] Desktop, tablet, and mobile each have a deliberately designed presentation rather than one compressed layout.
- [ ] Critical actions have feature parity across device classes, even when presentation differs.
- [ ] Dashboard, reports, activity, risk, money queues, and provider operations pass authenticated smoke tests and responsive visual regression.

## Delivery order

1. Admin design tokens, shared icons, and responsive shell/navigation.
2. Desktop, tablet, and mobile layout foundations.
3. KPI cards, command bar, and command palette.
4. Money flow, queue health, provider health, and risk summary.
5. Shared table, mobile card-list, saved views, and detail-panel system.
6. Reports and Activity hardening.
7. Operation queues, live activity, and alert center.
8. Member growth, game performance, and advanced analytics.
9. Themes, density controls, customization, accessibility, and full responsive visual regression.