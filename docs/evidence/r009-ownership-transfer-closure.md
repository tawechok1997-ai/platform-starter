# R-009 Ownership Transfer Transaction Closure

## Production path

`AdminAccessController.transferOwnership()` routes to `AdminOwnershipCommandService.transferOwnership()`.

## Transaction contract

The command service now:

1. validates the reason and performs step-up authentication before opening the database transaction;
2. locks the actor and target admin rows in deterministic UUID order through `lockAdminUserForUpdate()`;
3. reloads actor and target state through the transaction client;
4. revalidates owner authority, target active status, target 2FA, and absence of protected access;
5. removes the owner role from the actor;
6. assigns the same role to the target; and
7. writes `TRANSFER_ADMIN_OWNERSHIP` audit evidence.

Role removal, role assignment, and audit persistence all use the same Prisma transaction client. Any failure rolls the full transfer back.

## Guard

`tools/audit-r009-ownership-transfer-transaction.mjs` verifies controller routing, step-up ordering, deterministic locks, transaction-scoped revalidation, role mutations, audit persistence, and removal of legacy service delegation.

## Verification state

Source inspection and the strict source guard are complete. Railway API deployment for runtime commit `f45090480be1f5b0aece9277fcf5ed8416899e18` must succeed before the R-009 subtask is marked closed.

No Prisma schema, production data, permission model, or deployment target was changed.
