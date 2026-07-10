# Admin Activity Timeline

Activity Timeline เป็นหน้า read-only สำหรับรวมเหตุการณ์สำคัญจากข้อมูลเดิม โดยไม่เพิ่ม database table ใหม่

## Endpoint

```http
GET /admin/activity/timeline?page=1&take=30&type=ALL
```

Requires admin auth and permission:

```txt
admin.activity.view
```

## Query params

```txt
page = page number, default 1
take = page size, default 30, max 100
type = ALL | AUDIT | LEDGER | TOPUP | WITHDRAWAL
from = ISO date/date string
to = ISO date/date string
search = keyword search across title, status, ref, actor, member
actor = admin username/email keyword
memberId = exact member user ID
refType = exact ref type, such as topup or withdrawal
refId = exact reference ID
```

## Sources

Timeline รวมข้อมูลจาก:

- `AdminAuditLog`
- `WalletLedger`
- `TopUpRequest`
- `WithdrawalRequest`

ไม่มีการเขียนข้อมูลใหม่ และไม่มีการเปลี่ยนสถานะธุรกรรม

## UI

Admin page:

```txt
/activity
```

Features:

- summary metrics
- type filters
- advanced filters
- search
- timeline list
- pagination
- quick links to related pages

## Permission seed

After deploy, run:

```bash
pnpm db:seed:access
```

This creates and attaches:

```txt
admin.activity.view
admin.reports.view
```

If this is not seeded, non-wildcard admin roles may receive `403 Permission denied`.

## Smoke checks

`scripts/smoke-api.sh` now checks:

```txt
GET /admin/activity/timeline -> 401 without token
GET /admin/activity/timeline?page=1&take=1 -> 200 with ADMIN_TOKEN
GET /admin/activity/timeline?page=1&take=1&type=AUDIT&search=admin -> 200 with ADMIN_TOKEN
```

## QA checklist

1. Build API and admin web

```bash
pnpm build:api
pnpm build:web-admin
```

2. Seed permissions

```bash
pnpm db:seed:access
```

3. Open admin page

```txt
/activity
```

4. Verify

- page loads
- ALL filter works
- AUDIT filter works
- LEDGER filter works
- TOPUP filter works
- WITHDRAWAL filter works
- Search works
- Actor filter works
- Member ID filter works
- Ref type/ref ID filters work
- From/To date filters work
- Previous/Next works
- quick links open related pages

5. Smoke test

```bash
API_URL="https://api-service.up.railway.app" \
ADMIN_TOKEN="<admin-access-token>" \
./scripts/smoke-api.sh
```

## Notes

This page is intended for operations visibility. It is not a full immutable event sourcing ledger. Critical money-state truth should still come from wallet ledgers, audit logs, and reconciliation reports.
