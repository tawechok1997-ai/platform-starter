# Admin Data View Contract

Updated: 2026-07-21  
Status: Active  
Scope: `apps/web-admin`

## Objective

Define one reusable behavior contract for Admin queues, tables, reports and list/detail workspaces before consolidating implementations or choosing a table library.

## Applies to

- deposits and withdrawals;
- members, wallets and ledgers;
- risk alerts and watchlists;
- KYC queues;
- reports and audit activity;
- providers, promotions and CMS;
- support and operational queues.

## Required state model

Every data view supports these states explicitly:

- initial loading;
- background refreshing;
- loaded;
- empty result;
- filtered empty result;
- partial data;
- stale data;
- retryable error;
- terminal error;
- permission denied;
- session expired;
- version conflict during row action;
- bulk partial failure.

A background refresh must not replace an already useful table with a full-page spinner.

## URL state

The URL is the source of truth for shareable view state:

- search query;
- filters;
- sort field and direction;
- page or cursor;
- selected saved view;
- date range;
- detail entity when deep linking is safe.

Do not place secrets, unmasked identifiers, notes, tokens or sensitive evidence URLs in query parameters.

## Filtering

- Filters have explicit labels and removable chips.
- Clear-all is available when more than one filter is active.
- Invalid URL filter values fall back safely and do not crash rendering.
- Filter changes reset pagination unless the backend contract guarantees the current cursor remains valid.
- Date ranges show timezone and inclusive/exclusive semantics.
- Server-supported filters are not reproduced as inconsistent client-only filtering.

## Sorting

- Only documented sortable fields expose sorting controls.
- Sort direction is announced to assistive technology.
- Financial values sort by numeric value, not formatted text.
- Dates sort by canonical timestamp.
- Stable tie-breaking is defined by the API contract.

## Pagination and cursors

- Preserve active filters and sort when paging.
- Show total only when the backend provides a trustworthy total.
- Cursor pagination does not fabricate page numbers.
- Changing page size resets pagination.
- Back navigation restores prior view state and scroll position where practical.

## Columns and density

Column priority order:

1. primary identity;
2. operational status;
3. amount/severity/priority;
4. owner or assignee;
5. updated timestamp;
6. secondary metadata;
7. actions.

Rules:

- money uses tabular numerals and explicit currency;
- timestamps have a canonical format and timezone policy;
- long identifiers can wrap or copy without breaking layout;
- sensitive values are masked by default;
- row actions remain keyboard reachable;
- icon-only actions require accessible names;
- sticky headers must not obscure focused content.

## Mobile fallback

Below the table breakpoint, use cards or a list/detail pattern rather than forcing horizontal scanning for operational tasks.

Each mobile item must retain:

- primary identity;
- status and severity;
- amount or operational priority;
- timestamp;
- owner/assignee when relevant;
- safe primary action;
- route to full details.

Bulk selection on mobile must use an explicit selection mode and sticky action summary.

## Selection and bulk actions

- Selection is stable only within the active query unless the backend supports cross-page selection.
- The UI states whether selection applies to visible rows, current page or all matching results.
- Bulk actions show selected count and consequence before submit.
- Permission checks occur on the server for every item.
- Partial success returns per-item outcomes.
- Failed items remain selected when retry is safe.
- A user can export or copy failure details without exposing secrets.

## Row and detail actions

- Row click must not compete with text selection, links or action controls.
- Primary row identity links to a canonical detail route.
- Drawers/details restore focus to the triggering row when closed.
- Mutations follow `admin-form-mutation-safety.md`.
- A stale or conflicted row refreshes before a retry.

## Loading, empty and error presentation

### Initial loading

Use skeletons that approximate the final layout. Avoid indefinite generic spinners for dense operational views.

### Background refresh

Keep existing content, expose a subtle updating state and announce meaningful completion only when necessary.

### Empty

Differentiate:

- no records exist;
- filters exclude all records;
- permission hides records;
- data source is unavailable.

### Error

Provide:

- plain-language summary;
- safe retry when appropriate;
- preserved filters and view state;
- support/reference ID when available;
- no raw backend stack or secret-bearing message.

## Export

- Export uses the current canonical filters and sort.
- The UI states whether export contains current page, selected rows or all matching rows.
- Long-running exports show progress or queued status.
- Empty exports are prevented or clearly explained.
- Large exports warn about time and sensitivity.
- Download links use secure expiry and failure feedback.

## Saved views

A saved view may contain:

- safe filters;
- sort;
- visible columns;
- density;
- date-range preset.

It must not contain:

- tokens;
- unrestricted sensitive IDs;
- row selection;
- temporary evidence URLs;
- mutation state.

## Library decision gate

TanStack Table may be adopted only after the inventory records:

- number of table/queue implementations;
- duplicated sorting/filtering/selection behavior;
- server-side pagination requirements;
- current bundle size and projected impact;
- adapter design for existing Admin primitives;
- migration sequence;
- browser and component test plan;
- rollback path.

A library does not own server state, permissions, audit semantics or API contracts.

## Verification checklist

- six standard viewports;
- keyboard sorting and row actions;
- screen-reader table/card names;
- 200% zoom and reflow;
- long Thai text, IDs and money;
- empty, filtered-empty, loading, stale and error states;
- cursor/page back navigation;
- bulk partial failure;
- permission change during operation;
- detail drawer focus restoration;
- export failure and expired download;
- no unexpected console or network errors.
