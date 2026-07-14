# Temporary Architecture Boundary Exceptions

This registry is the only supported place for temporary dependency-boundary exceptions.

An exception must include an owner, a concrete reason, a removal target, and an expiry date. Expired or undocumented exceptions fail `pnpm audit:architecture-boundaries`.

| ID | Caller | Callee / forbidden dependency | Owner | Reason | Removal target | Expires |
|---|---|---|---|---|---|---|

There are currently **no active boundary exceptions**.

## Rules

- Exceptions may not bypass authentication, authorization, transaction, idempotency, audit, storage privacy, or secret-handling controls.
- New exceptions must be added in the same change that introduces the dependency.
- Expiry uses ISO `YYYY-MM-DD` and must not exceed 90 days without a documented architecture review.
- Removing the dependency requires removing its registry row in the same change.
