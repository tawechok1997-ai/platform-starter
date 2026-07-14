# R-009 Legacy Transaction Escape Closure

## Scope

This evidence closes the remaining method-level legacy transaction escape review for the current API service inventory.

## Reviewed inventory

- Inventory source: `tools/audit-r009-transaction-escapes.mjs`
- Review ledger: `docs/evidence/r009-transaction-escape-review.json`
- Ledger validation: `tools/audit-r009-transaction-review-ledger.mjs`
- Required workflow: `.github/workflows/r009-parallel-boundary-closure.yml`

The current review ledger contains one same-method finding:

- `apps/api/src/modules/admin-access/admin-access.service.ts#createInvitation#adminAuditLog.create`

It is classified as `safe-direct-write` because the production invitation route no longer invokes the legacy `AdminAccessService.createInvitation` method. Production create and reissue commands are routed through `AdminInvitationAdminService`, where account/token/audit writes share transaction ownership. Dedicated invitation guards enforce controller routing and atomic persistence.

## Strict enforcement

The required R-009 workflow now runs the method-level inventory with:

```text
R009_TRANSACTION_STRICT=1
```

Strict mode rejects:

- any `confirmed` same-method escape;
- any unreviewed same-method finding;
- any stale review-ledger entry.

This converts the reviewed baseline from advisory inventory into a fail-closed boundary.

## Verification

- Review-ledger schema and reasons are guarded by `audit-r009-transaction-review-ledger.mjs`.
- Strict inventory enforcement was committed in `e4b244bc21a8941c14f8fbabc059a35e975b82ae`.
- Railway API, admin, and member deployments succeeded for that commit.

## Safety

No schema, production data, secret, permission, finance-provider, or deployment-target changes were made. The legacy method remains non-production and is guarded against accidental routing regression.
