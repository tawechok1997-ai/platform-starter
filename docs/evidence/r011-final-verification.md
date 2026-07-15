# R-011 Final Verification

## Outcome

R-011 Error, authorization and security boundary is closed at 14/14 in `docs/r011-progress.md`.

## Authorization domain ownership

The central registry covers:

- finance
- admin lifecycle
- KYC and risk
- support and notifications
- CMS and reports

Controller `@RequirePermission(...)` metadata is scanned from real routed handlers. Every routed permission must map to one declared domain, and domain decisions delegate to the shared `requirePermission` policy.

## Security boundaries

- Domain errors are framework independent and map through one HTTP adapter.
- Error codes and localization-ready message keys are stable.
- Resource authorization, step-up, mandatory reason and audit requirements use shared policies.
- DTO, business and persistence validation failures are separated.
- Email, phone, bank account and Unicode inputs use shared normalization.
- Runtime logs use recursive sensitive-data redaction.
- CSRF origin evidence and critical idempotency constraints are protected by static audits.

## Verification

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

CI workflow: `.github/workflows/r011-security-boundaries.yml`.
