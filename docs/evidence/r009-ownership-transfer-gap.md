# R-009 Ownership Transfer Transaction Gap

Status: PARTIAL

The current `AdminAccessService.transferOwnership` flow verifies step-up authentication and performs role removal, role assignment, and admin-audit creation through one Prisma transaction client.

The remaining concurrency gap is that actor and target account validation occurs before the transaction. The transaction does not re-lock and revalidate the actor and target rows before moving the protected role. A concurrent status or role change could therefore invalidate assumptions made before the transaction begins.

Required closure:

1. Lock the acting admin row.
2. Lock the target admin row in deterministic ID order.
3. Re-read and validate active status, 2FA state, and protected-role ownership inside the transaction.
4. Move the protected role and write the audit event through the same transaction client.
5. Add rollback and concurrent-transfer regression coverage.

Automated evidence: `tools/audit-r009-ownership-transfer-transaction.mjs` intentionally fails until the transactional actor/target lock order is present.
