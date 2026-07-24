# P6 Verification Evidence

> คัดลอกไฟล์นี้เป็นเอกสารผลรันใหม่ ห้ามใส่ password, token, cookie, API key, provider secret, private URL หรือข้อมูลส่วนบุคคลจริง

## Run metadata

| Field | Value |
|---|---|
| Environment | `non-production / staging / production` |
| Started at | `YYYY-MM-DDTHH:mm:ssZ` |
| Finished at | `YYYY-MM-DDTHH:mm:ssZ` |
| Approved commit | `<sha>` |
| Operator | `<role or team>` |
| API origin | `<redacted-safe origin>` |
| Admin origin | `<redacted-safe origin>` |
| Member origin | `<redacted-safe origin>` |
| Provider code | `<code or N/A>` |

## Preflight

### Readiness

Command:

```bash
pnpm verify:p6:readiness:json
```

Result: `PASS / FAIL / BLOCKED`

Missing or invalid fields:

- None

Artifact: `<path or CI artifact name>`

### Connectivity

Command:

```bash
pnpm verify:p6:connectivity:json
```

| Service | Status | HTTP | Notes |
|---|---|---:|---|
| API | `PASS/FAIL` | `200` | |
| Admin | `PASS/FAIL` | `200` | |
| Member | `PASS/FAIL` | `200` | |

Artifact: `<path or CI artifact name>`

### Deployment identity

Command:

```bash
pnpm verify:p6:deployment:json
```

Result: `PASS / FAIL / BLOCKED`

Observed commit/version: `<sha or version>`

Artifact: `<path or CI artifact name>`

## Authenticated regression

| Scenario | Result | Artifact | Notes |
|---|---|---|---|
| Seeded Admin/Member credentials | `PASS/FAIL/BLOCKED` | | |
| Deposit end-to-end | `PASS/FAIL/BLOCKED` | | |
| Withdrawal end-to-end | `PASS/FAIL/BLOCKED` | | |
| Duplicate/retry/error money flow | `PASS/FAIL/BLOCKED` | | |
| Notification optimistic rollback | `PASS/FAIL/BLOCKED` | | |
| Owner transfer | `PASS/FAIL/BLOCKED` | | |
| Account lifecycle | `PASS/FAIL/BLOCKED` | | |
| Read-only role | `PASS/FAIL/BLOCKED` | | |
| Mutation controls hidden/blocked | `PASS/FAIL/BLOCKED` | | |
| Six-viewport visual regression | `PASS/FAIL/BLOCKED` | | |
| Support/CMS/Reports | `PASS/FAIL/BLOCKED` | | |
| KYC/Risk | `PASS/FAIL/BLOCKED` | | |

## Deployed environment verification

| Scenario | Result | Artifact | Notes |
|---|---|---|---|
| Provider-down/game-launch | `PASS/FAIL/BLOCKED` | | |
| Reverse proxy | `PASS/FAIL/BLOCKED` | | |
| Login/refresh/logout/cookie | `PASS/FAIL/BLOCKED` | | |
| Session reuse/rotation | `PASS/FAIL/BLOCKED` | | |
| Anti-bot failure/fallback | `PASS/FAIL/BLOCKED` | | |

## Staging and production verification

| Scenario | Result | Artifact | Notes |
|---|---|---|---|
| Staging migration/rollback | `PASS/FAIL/BLOCKED` | | |
| Production migration status | `PASS/FAIL/BLOCKED` | | |
| Production account/provider | `PASS/FAIL/BLOCKED` | | |
| Production-scale indexes | `PASS/FAIL/BLOCKED` | | |
| Aggregate/cache workload | `PASS/FAIL/BLOCKED` | | |
| Storage retention/malware policy | `PASS/FAIL/BLOCKED` | | |

## Vendor/provider UAT

| Scenario | Result | Artifact | Notes |
|---|---|---|---|
| Endpoint and credentials | `PASS/FAIL/BLOCKED` | | |
| Signature/error contract | `PASS/FAIL/BLOCKED` | | |
| IP whitelist/callback | `PASS/FAIL/BLOCKED` | | |
| Reconciliation | `PASS/FAIL/BLOCKED` | | |
| Provider anti-bot | `PASS/FAIL/BLOCKED` | | |
| Final real-money UAT | `PASS/FAIL/BLOCKED` | | |

## Failures and blockers

| ID | Severity | Scenario | Symptom | Owner | Next action |
|---|---|---|---|---|---|
| P6-001 | | | | | |

## Final decision

- Overall result: `PASS / FAIL / BLOCKED`
- Safe to promote: `YES / NO`
- Real-money gate may open: `YES / NO`
- Approved by: `<role or team>`
- Approval timestamp: `YYYY-MM-DDTHH:mm:ssZ`

## Redaction confirmation

- [ ] ไม่มี password, token, cookie หรือ secret
- [ ] ไม่มี production export หรือข้อมูลส่วนบุคคลจริง
- [ ] Provider payload และ request ID ถูก redact แล้ว
- [ ] Screenshot/trace ใช้เฉพาะ test accounts
- [ ] Artifact retention ตรงตามนโยบาย
