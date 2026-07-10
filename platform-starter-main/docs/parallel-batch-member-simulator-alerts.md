# Parallel Batch: Member UX, Simulator v2, Alerts, Admin Ops, Smoke

## 1. Member UX/UI polish

Added:

```text
apps/web-member/app/member-bottom-nav.tsx
apps/web-member/app/member-home.tsx
```

Changes:

- mobile bottom navigation
- member market hero
- quick action panel
- summary cards
- pending badge on history nav
- cleaner empty/loading/error sections

## 2. Provider Simulator v2

Updated:

```text
apps/api/src/modules/money-ops/money-ops.service.ts
```

Supported simulator modes:

```text
success
failed
timeout
mismatch
duplicate
invalid_signature
```

Useful endpoints:

```text
GET  /provider-simulator/health
POST /provider-simulator/launch
POST /provider-simulator/balance
POST /provider-simulator/transfer-in
POST /provider-simulator/transfer-out
POST /provider-simulator/webhook
POST /provider-simulator/timeout
```

Example failed transfer:

```json
{ "amount": 100, "mode": "failed" }
```

Example balance mismatch:

```json
{ "mode": "mismatch" }
```

Example invalid signature webhook:

```json
{ "mode": "invalid_signature" }
```

## 3. Alert / RiskAlert Engine

Added Money Ops alert actions:

```text
PATCH /admin/money-ops/risk-alerts/:id/resolve
PATCH /admin/money-ops/risk-alerts/:id/dismiss
```

Both actions:

- require admin auth
- update alert status
- store note in metadata
- write AdminAuditLog

## 4. Admin Ops polish

Updated:

```text
apps/web-admin/app/(admin)/money-ops/page.tsx
```

Changes:

- safety state card
- open alert queue
- resolve/dismiss actions
- simulator mode list
- improved scan alert result text

## 5. Smoke / E2E Tests

Updated:

```text
tests/smoke/game-platform-safety.spec.ts
```

Added coverage:

- Money Ops control center
- alert rules
- provider simulator modes
- alert scan persistence
- ledger mutation gate

## Verify

```bash
pnpm prisma generate
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
pnpm test:e2e:smoke
```
