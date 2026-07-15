# R-011 Progress — Error, Authorization and Security Boundary

Source of truth: `docs/master-project-worklist.md` → P4 → R-011

## Status

- DONE: 14/14
- IN PROGRESS: none
- Remaining: 0

## Checklist

- [x] สร้าง domain error taxonomy
- [x] แยก domain error จาก HTTP exception
- [x] ทำ HTTP error mapper กลาง
- [x] ทำ stable error codes และ localization-ready message keys
- [x] รวม authorization policies ต่อ domain
- [x] เพิ่ม resource-level authorization
- [x] รวม step-up/2FA requirement checks
- [x] รวม mandatory reason/audit checks
- [x] แยก DTO validation, business validation และ persistence constraint
- [x] ทำ input normalization สำหรับ email/phone/bank account/Unicode
- [x] ทำ sensitive logging redact policy
- [x] เพิ่ม static audit ป้องกัน log token/password/OTP/secret/private URL
- [x] ตรวจ CSRF/replay/idempotency boundaries
- [x] เพิ่ม security policy tests

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

### 5–6. Domain/resource authorization and step-up policy

- Shared permission and resource-owner decisions are framework/persistence independent.
- A central domain registry owns finance, admin lifecycle, KYC/risk, support/notifications and CMS/reports permission prefixes.
- Routed `@RequirePermission(...)` metadata is audited against the registry.
- Cross-domain permission reuse is denied by the shared policy.
- Resource owners may access their own resource; explicit bypass permissions are supported.
- Step-up freshness validates timestamp, maximum age, future timestamps and allowed methods.

### 7–9. Mandatory reason/audit, input normalization and security policy tests

- Mandatory reason policy normalizes Unicode and whitespace before validation.
- Audit events use a constrained machine-readable identifier format.
- Shared normalization covers Unicode text, email, phone and bank-account inputs.
- Unit tests cover authorization, ownership, step-up, reason/audit and normalization edge cases.

### 10–11. Sensitive logging policy and static audit

- Shared redaction handles nested records, arrays, Error values, circular references and sensitive query parameters.
- HTTP access logs, global exception logs and Redis failure logs use the shared policy.
- Static CI audit prevents drift back to unredacted runtime error logging.

### 12–13. Validation and request-safety boundaries

- DTO, business and persistence failures have explicit layers and stable error codes.
- Persistence constraints map to conflict semantics while DTO/business failures map to validation semantics.
- CSRF origin protection remains recorded in the security worklist.
- Critical top-up, withdrawal, ledger and transfer idempotency constraints are audited from the Prisma schema.
- Existing R-009 critical constraint closure evidence is required to remain present.

### 14. Domain authorization closure

- `domain-authorization-policy.ts` is the source of truth for domain ownership of permission prefixes.
- Controller permission metadata is scanned from real routed handlers.
- Every routed permission must resolve to one declared domain.
- Policy decisions still flow through the shared `requirePermission` implementation.
- CI runs registry audit, contract tests and API typecheck.

## Verification commands

```bash
node tools/audit-r011-error-boundaries.mjs
node tools/audit-r011-authorization-policies.mjs
node tools/audit-r011-domain-authorization.mjs
node tools/audit-r011-security-policy-foundations.mjs
node tools/audit-r011-sensitive-logging.mjs
node tools/audit-r011-request-safety-boundaries.mjs
pnpm --filter @platform/api test -- --runInBand domain-error-http.mapper.spec.ts authorization-policy.spec.ts domain-authorization-policy.spec.ts step-up-policy.spec.ts reason-audit-policy.spec.ts input-normalization.spec.ts sensitive-log-redactor.spec.ts validation-boundary.spec.ts
pnpm --filter @platform/api typecheck
```
