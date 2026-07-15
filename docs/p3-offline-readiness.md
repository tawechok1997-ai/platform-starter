# P3 Offline Provider Readiness

Date: 2026-07-15

Status: CODE-ONLY READINESS COMPLETE / VENDOR INPUT REQUIRED

## Completed without a live provider

- Generic provider endpoint and credential contracts.
- Provider adapter interface for health, launch, balance, transfer, game sync, bet history, webhook validation, and webhook parsing.
- Adapter registry/template and safe real-money gates.
- Generic webhook signature and idempotency infrastructure already present in the repository.
- Provider readiness validation for:
  - provider code
  - safe HTTP(S) base URL
  - timeout bounds
  - ISO-style three-letter currency code
  - required endpoint presence and URL validity
  - required credential presence without exposing credential values
- Unit tests for complete configuration, missing requirements, unsafe URLs, invalid timeout, invalid currency, and secret-safe error output.

## Files added

- `apps/api/src/modules/game-platform/provider-readiness.ts`
- `apps/api/src/modules/game-platform/provider-readiness.spec.ts`

## Remaining external work

The following cannot be completed correctly without the chosen vendor:

- Production endpoint URLs and credentials.
- Vendor-specific signature, timestamp, replay, and error-code contract.
- Vendor IP allowlist and callback requirements.
- Provider-specific sandbox/production UAT covering launch, balance, transfer, retry, reversal, webhook, duplicate callback, reconciliation, and outage behavior.

## Verification command

```bash
pnpm --filter @platform/api test -- provider-readiness.spec.ts --runInBand
```

P3 must remain externally blocked until the vendor inputs and UAT evidence exist. The code-only preparation is complete, but it must not be represented as a live-provider integration.
