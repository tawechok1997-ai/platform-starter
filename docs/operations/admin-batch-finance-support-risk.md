# Admin Batch — Finance, Support and Audit Risk

Updated: 2026-07-23

## Verified on `main`

### Wallet Statement

- Member and date filters
- Running balance using balance-before and balance-after
- Grouping by day
- CSV export and print/PDF flow
- Transaction detail drawer
- Server pagination, loading, empty and error states

### Wallet Analytics

- 7, 14, 30 and 90 day ranges
- Daily net-flow chart and detailed table
- Empty/loading/error states
- Tooltip through chart item titles and accessible chart label
- Liquidity, locked-balance and pending-queue health metrics

### Support Center

- Ticket severity and SLA
- Canned replies
- Conversation timeline
- Open, Reviewing, Resolved and Dismissed workflows
- Permission gating, confirmation and busy states

## Implemented in this branch

### Audit Risk

- Event timeline sorted newest first
- Module and action filters
- Before/after drawer
- CSV export respects active filters
- Related-record links for finance, member, risk and provider modules
- Loading skeleton, safe error copy and resilient detail loading

## Safety

- Admin frontend only
- Audit Risk remains read-only
- No API, Prisma, provider or wallet mutation behavior changed
