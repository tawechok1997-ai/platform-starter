# P6 Verification Run Evidence

> สร้างสำเนาไฟล์นี้ต่อหนึ่ง environment/run และห้ามใส่ credentials, tokens, OTP seeds, private keys หรือ personal data

## Run identity

- Date/time:
- Timezone:
- Environment:
- Admin URL:
- Member URL:
- API URL:
- Approved commit SHA:
- Deployment version/commit reported by health endpoint:
- Operator:
- Approver:

## Scope

- [ ] Credentials and authenticated regression
- [ ] Deployed environment verification
- [ ] Staging/production verification
- [ ] Vendor/provider UAT

## Preflight results

| Check | Command or source | Result | Evidence |
|---|---|---|---|
| Runtime | `pnpm check:runtime` |  |  |
| Repository | `pnpm check:repository` |  |  |
| Typecheck | `pnpm typecheck` |  |  |
| Security | `pnpm audit:dependency-security` |  |  |
| P6 readiness | `pnpm verify:p6:readiness:strict` |  |  |
| Connectivity | `pnpm verify:p6:connectivity:strict` |  |  |
| Deployment identity | `pnpm verify:p6:deployment:strict` |  |  |

## Test results

| Worklist item | Expected | Actual | Status | Evidence/issue |
|---|---|---|---|---|
|  |  |  | PASS / FAIL / BLOCKED |  |

## Financial reconciliation

- Deposit reference(s), sanitized:
- Withdrawal reference(s), sanitized:
- Wallet delta:
- Ledger delta:
- Provider delta:
- Reconciliation result:
- Duplicate/retry/reversal evidence:

## Security and privacy review

- [ ] No secrets in logs or artifacts
- [ ] No personal data in screenshots/traces
- [ ] Cookies have expected scope, flags and rotation
- [ ] Read-only role cannot mutate protected resources
- [ ] Private storage URLs expire and require authorization
- [ ] Anti-bot failure/fallback matches approved mode

## Visual/browser artifacts

- Desktop Admin:
- Mobile Admin:
- Desktop Member:
- Mobile Member:
- Trace/video/report location:
- Console/network error summary:

## Migration and production evidence

- Migration status:
- Rollback test:
- Index/query evidence:
- Aggregate/cache workload evidence:
- Storage retention approval:
- Malware scan approval:

## Vendor UAT

- Vendor/provider:
- Endpoint/version:
- Signature contract version:
- IP whitelist/callback status:
- Reconciliation result:
- Provider-specific anti-bot result:
- Vendor approver:

## Exceptions and follow-up

| Issue | Severity | Owner | Required action | Retest evidence |
|---|---|---|---|---|
|  |  |  |  |  |

## Closure

- [ ] Every claimed P6 checkbox has attached environment evidence
- [ ] Failed or blocked items remain unchecked in the master worklist
- [ ] Operator reviewed redaction
- [ ] Approver accepted the run

Final decision: APPROVED / REJECTED / PARTIALLY APPROVED
