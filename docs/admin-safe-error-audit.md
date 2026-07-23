# Admin Safe Error Audit Matrix

> Source audit on `main` · 2026-07-24
>
> Goal: Admin UI must not render raw backend stack traces, SQL/ORM details, file paths, credentials, tokens, debug payloads, or oversized technical messages.

## Shared boundary

| Boundary | Status | Evidence | Behavior |
|---|---|---|---|
| `adminApiFetch` | ✅ Protected | `apps/web-admin/app/admin-api.ts` | Sanitizes every non-2xx JSON response before route code reads it |
| Safe message mapper | ✅ Protected | `apps/web-admin/app/(admin)/_components/admin-safe-error.ts` | Allows short business messages; maps known codes/statuses; rejects technical patterns |
| Sensitive top-level keys | ✅ Removed | `stack`, `trace`, `traceback`, `debug`, `exception`, `cause`, `query`, `sql` | Removed from sanitized error response |
| Response headers | ✅ Normalized | `content-length`, `content-encoding`, `transfer-encoding` removed | Prevents stale headers after replacing the response body |
| Locale | ✅ Supported | `admin_locale` | Generic status messages resolve to Thai or English |
| Session redirect | ✅ Preserved | `handleAdminResponse` runs before sanitization | 401/403 refresh, login redirect, and 2FA setup behavior remain unchanged |

## Route groups using `adminApiFetch`

All routes below inherit the shared boundary without duplicating safe-error parsing.

| Route group | Examples audited | Status | Notes |
|---|---|---|---|
| Dashboard / Operations | `/dashboard`, `/operations` | ✅ Covered | Load failures and queue errors receive sanitized payloads |
| Finance queues | `/topups`, `/withdrawals`, `/wallet-ledgers`, bulk queue | ✅ Covered | Money workflows retain `code/status` while UI-facing `message` is sanitized |
| Finance reports | Wallet statement, analytics, reports, exports, reconciliation | ✅ Covered | Server failures map to generic 5xx copy rather than backend details |
| Risk / Audit | Risk alerts, audit risk, audit logs | ✅ Covered | Permission and not-found messages map by status/code |
| Support | `/support-center` | ✅ Covered | Ticket workflow messages remain short business copy |
| Providers / Games | Providers, sessions, transfers, webhook logs | ✅ Covered | Provider payload display remains a separate redaction task under D-09 |
| Promotion / Content | Promotion Center, Content Center, Promotion Operations | ✅ Covered | Settings endpoint errors are sanitized globally |
| Settings | All `SettingsSectionPage` groups | ✅ Covered | `useAdminSettingsForm` uses `adminApiFetch` |
| Security | `/security/2fa` and authenticated security routes | ✅ Covered | 2FA setup/enable errors pass through sanitized response |

## Direct-request exceptions

| Surface | Request path | Status | Evidence |
|---|---|---|---|
| Admin Login | `createApiClient` to login and 2FA verify | ✅ Safe by local copy | Catch block shows only timeout or generic login failure; backend `message` is not rendered |
| Token refresh | direct `fetch('/api/admin/auth/refresh')` | ✅ Non-display | Failure only clears session and returns an empty token; no payload is shown to the user |
| Media/browser APIs | image/video loads, `FileReader`, clipboard | ✅ Local generic copy | Browser errors use fixed UI messages, not backend error bodies |

## Safe-message rules

A backend message is shown only when all conditions pass:

1. Length is at most 240 characters.
2. No newline, tab, HTML-like delimiters, stack syntax, source line reference, local/server path, SQL/ORM/database term, credential/token/secret term, or oversized JSON-like payload.
3. Known error codes take precedence: `FORBIDDEN`, `UNAUTHORIZED`, `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`.
4. Unknown unsafe content falls back to status-based Thai/English copy.

## Status mapping

| HTTP status | User-facing result |
|---|---|
| 400 / 422 | Invalid information; review and retry |
| 401 | Session expired; sign in again |
| 403 | No permission |
| 404 | Record not found |
| 409 | Record changed; refresh and retry |
| 429 | Too many requests |
| 5xx | Service temporarily unavailable |

## Remaining boundaries

These are intentionally not claimed as complete by D-04:

- Nested provider payload redaction and fixture tests: D-09.
- Field-level masking for audit exports: `/audit` task.
- Error telemetry and server-side log retention: operational observability work, not UI message rendering.
- Browser evidence that each route displays the expected copy for every status code: D-08 regression matrix.

## Rule for new Admin routes

- Use `adminApiFetch` for authenticated Admin API calls.
- Direct API clients must display fixed local copy or call `safeAdminErrorMessage` before rendering any backend message.
- Never render `error.message`, response text, stack, query, debug, provider payload, or serialized exception directly.
