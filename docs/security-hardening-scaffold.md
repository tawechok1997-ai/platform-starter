# Security Hardening Scaffold

Current checklist endpoint:

```text
GET /admin/money-ops/security-hardening
```

## Controls to implement before production

- Rate limit admin money operations.
- Rate limit provider webhook endpoints.
- Limit webhook request body size.
- Add provider IP allowlist before real settlement.
- Rotate provider credentials on schedule.
- Audit every gate/retry/review/resolve action.
- Keep `realMoneyEnabled` false until preflight passes.
- Test backup and restore before real wallet mutation.

## Recommended implementation order

1. Request body size limits for webhook routes.
2. Rate limit provider webhook route.
3. Rate limit admin money operations.
4. IP allowlist config scaffold.
5. Credential rotation reminders.
6. Alert on real-money gate changes.
7. Backup/restore runbook.

## No-go rules

Do not enable real wallet mutation until security hardening checklist is reviewed and signed off.
