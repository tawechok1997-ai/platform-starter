# Finance, Security, and Provider Outage Runbook

## Finance incident

1. Freeze affected money-changing actions if balances, ledger idempotency, or settlement correctness are in doubt.
2. Preserve request IDs, actor IDs, ledger IDs, provider transaction IDs, and audit log IDs.
3. Run read-only reconciliation first; do not patch balances directly.
4. Use existing workflow reversal/fail/retry guards where available.
5. Reopen operations only after ledger, wallet, provider, and audit evidence match.

## Security incident

1. Preserve logs and request IDs before rotating credentials.
2. Revoke affected sessions/tokens using admin/member session commands.
3. Rotate secrets through the deployment secret manager, not source files.
4. Verify sensitive logs remain redacted before sharing evidence externally.
5. Record affected actor IDs, actor type, module, action, result, and duration from structured logs.

## Provider outage

1. Disable provider launch/transfer paths through safe gates or provider status controls.
2. Keep webhook ingestion idempotent; do not replay callbacks until signatures and duplicate handling are confirmed.
3. Capture provider health-check result, request ID, response code, and reconciliation status.
4. Resume provider traffic gradually after a successful provider health check and reconciliation review.

## Evidence to attach

- Structured log samples with `requestId`, `actorId`, `actorType`, `module`, `action`, `durationMs`, and `result`.
- Ledger/reconciliation export or query output.
- Provider health-check output.
- Session revocation or secret rotation confirmation where applicable.
