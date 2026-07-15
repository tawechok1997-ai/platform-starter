# R-011 Progress — Error, Authorization and Security Boundary

Source of truth: `docs/master-project-worklist.md` → P4 → R-011

## Status

- DONE: 4/14
- IN PROGRESS: authorization policies per domain
- Remaining: 10

## Checklist

- [x] สร้าง domain error taxonomy
- [x] แยก domain error จาก HTTP exception
- [x] ทำ HTTP error mapper กลาง
- [x] ทำ stable error codes และ localization-ready message keys
- [ ] รวม authorization policies ต่อ domain
- [ ] เพิ่ม resource-level authorization
- [ ] รวม step-up/2FA requirement checks
- [ ] รวม mandatory reason/audit checks
- [ ] แยก DTO validation, business validation และ persistence constraint
- [ ] ทำ input normalization สำหรับ email/phone/bank account/Unicode
- [ ] ทำ sensitive logging redact policy
- [ ] เพิ่ม static audit ป้องกัน log token/password/OTP/secret/private URL
- [ ] ตรวจ CSRF/replay/idempotency boundaries
- [ ] เพิ่ม security policy tests

## Closed outcomes

### 1–3. Domain error taxonomy, HTTP separation and mapper

- `DomainError` has no NestJS/HTTP dependency.
- Categories map deterministically to HTTP statuses through one mapper.
- The global exception filter handles domain errors before legacy message-based fallback.
- Existing `HttpException` response behavior remains intact during migration.
- Unit contract tests cover every category.
- Static CI guard prevents boundary drift.

### 4. Stable error codes and localization-ready message keys

- Stable message keys are resolved from a central catalog.
- Every `DomainError` carries a deterministic `messageKey`.
- Unknown codes fall back to normalized `errors.<code>` keys.
- The global error response preserves `code`, `messageKey`, `message` and safe `details`.
- Mapper contract tests cover default and explicitly supplied message keys.

## Verification commands

```bash
node tools/audit-r011-error-boundaries.mjs
pnpm --filter @platform/api test -- --runInBand domain-error-http.mapper.spec.ts
pnpm --filter @platform/api typecheck
```
