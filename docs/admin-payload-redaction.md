# Admin Payload Redaction Boundary

> D-09 closure evidence · 2026-07-24

## Scope

This boundary prevents provider and transport secrets from being rendered in Admin technical payload views or written into centralized API exception logs.

### Admin UI boundary

- Utility: `apps/web-admin/app/(admin)/_components/admin-payload-redaction.ts`
- Provider fixtures: `apps/web-admin/app/(admin)/_components/admin-payload-redaction.spec.ts`
- Adoption guard: `apps/web-admin/app/(admin)/_components/admin-payload-redaction-adoption.spec.ts`
- Adopted routes:
  - `apps/web-admin/app/(admin)/game-transfers/page.tsx`
  - `apps/web-admin/app/(admin)/game-transfers/[id]/page.tsx`
  - `apps/web-admin/app/(admin)/webhook-logs/page.tsx`

### API log boundary

- Utility: `apps/api/src/common/security/sensitive-log-redactor.ts`
- Provider fixtures: `apps/api/src/common/security/sensitive-log-redactor.spec.ts`
- Existing centralized consumer: `apps/api/src/common/filters/http-exception.filter.ts`

## Redacted data

The shared rules redact exact or provider-prefixed forms of:

- Passwords, passcodes, PINs and OTPs
- Access, refresh, session and ID tokens
- Authorization and proxy-authorization values
- Cookies and set-cookie values
- Client, signing and webhook secrets
- API keys and private keys
- Credentials and credential containers
- Signatures
- Signed, pre-signed and private URLs
- JWTs
- Sensitive query parameters
- Bearer and Basic credentials embedded inside strings

Examples such as `x-api-key`, `providerClientSecret` and `webhookSignature` are covered by normalized suffix matching.

## Preserved audit identifiers

These values remain visible because operators need them for reconciliation and incident review:

- `providerTransactionId`
- `idempotencyKey`
- `sessionId`
- `gameCode`
- `x-request-id`
- Non-sensitive provider status and business payload fields

## Safety bounds

- Maximum recursion depth: 12
- Maximum array items: 100
- Maximum object keys: 100
- Maximum string length: 5,000 characters
- Circular references become `[circular]`
- Excess depth becomes `[max-depth]`
- Truncated data is explicitly marked

## Regression protection

Provider fixtures verify nested request/response payloads, headers, cookies, secrets, signatures, sensitive URLs, JWTs, circular objects and oversized values.

The adoption spec fails if Game Transfers or Webhook Logs return to raw technical rendering through direct `JSON.stringify(payload)` or an unredacted `AdminPayloadViewer` call.

## Passing evidence

Verification PR: `#154` (`verify/admin-payload-redaction-v3-20260724`)

- P5 Security Audit run: `30042666625`
  - Job `89326151193`: success
  - Dependency audit: success
  - Committed-secret audit: success
  - Environment schema tests: success
- Quality Gate run: `30042665990`
  - API job `89326149139`: build and tests passed
  - Admin job `89326149111`: build passed
  - Member job `89326149218`: build passed
- Build run: `30042665937`
  - Job `89326148620`: success
  - Architecture and response-safety audits passed
  - API/Admin/Member typechecks passed
  - API and database regression tests passed
  - API/Admin/Member builds passed
- Full-System run: `30042666172`
  - Job `89326149456`: automated profile passed
  - Test summary and report upload passed
  - Artifact `8577954279`: `full-system-ci-30042666172`
  - Digest: `sha256:832be1152f64904c55040566d3b8dccf54a4343820d707d390f9a7dda55f4a03`
  - Expires: 2026-08-06

## Limits

- This change redacts Admin rendering and centralized API logs. It does not claim that stored provider payloads were deleted, field-encrypted or migrated.
- Raw payload access at other future surfaces must adopt the same boundary before rendering or logging.
- Audit identifiers intentionally remain visible and must not be treated as credentials.
