# Reports Analytics

Admin reports provide read-only finance analytics, reconciliation checks, CSV exports, and pending queue aging.

## Permissions

Reports endpoints require admin auth and permission:

```txt
admin.reports.view
```

After deploy, run:

```bash
pnpm db:seed:access
```

## Endpoints

### Daily summary

```http
GET /admin/reports/daily
GET /admin/reports/daily?from=2026-07-01&to=2026-07-08
```

### Finance trends

```http
GET /admin/reports/trends?days=7
GET /admin/reports/trends?days=14
GET /admin/reports/trends?days=30
```

### Pending queue aging

```http
GET /admin/reports/queue-aging
```

Returns:

- pending topup count
- pending withdrawal count
- oldest pending age
- over 15 minutes count
- over 60 minutes count
- over 24 hours count
- oldest pending queue items

### Reconciliation

```http
GET /admin/reports/reconciliation?limit=100
```

## CSV exports

```http
GET /admin/exports/report-trends.csv?days=30
GET /admin/exports/reconciliation.csv?limit=1000
```

The admin web downloads CSV through `fetch` with the current admin bearer token.

## UI

Admin page:

```txt
/reports
```

Features:

- wallet and ledger metrics
- pending queue metrics
- pending queue aging
- finance trend 7/14/30 days
- trend CSV export
- daily summary
- reconciliation summary
- reconciliation CSV export

## QA checklist

1. Build

```bash
pnpm build:api
pnpm build:web-admin
```

2. Seed permissions

```bash
pnpm db:seed:access
```

3. Open admin reports

```txt
/reports
```

4. Verify

- reports page loads
- finance trend loads
- 7d / 14d / 30d switches work
- queue aging section loads
- trend CSV downloads
- reconciliation CSV downloads
- reconciliation still loads

5. Smoke test

```bash
API_URL="https://api-service.up.railway.app" \
ADMIN_TOKEN="<admin-access-token>" \
./scripts/smoke-api.sh
```

## Notes

Queue aging is based on `createdAt` of pending topups and withdrawals. It does not change any request status.
