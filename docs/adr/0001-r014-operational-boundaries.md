# ADR 0001: R-014 Operational Boundaries

Date: 2026-07-15

## Status

Accepted for the current R-014 workstream.

## Context

R-014 requires observability, documentation, and cleanup work without destabilizing financial, auth, KYC, provider, or support behavior. The repository already has module boundary, transaction, API client, session, storage, audit, and cache requirements spread across prior P4 work.

## Decision

1. Module boundaries remain source-code first: controllers expose HTTP contracts, command/query/workflow services own behavior, repositories/adapters own persistence/provider details, and docs must cite the owning implementation path.
2. Transaction boundaries for money, ownership transfer, KYC review, watchlist override, and settlement stay inside dedicated command/workflow services.
3. API clients stay centralized through the shared package and app integrations; new local helpers must be justified and audited.
4. Sessions keep admin/member separation and HttpOnly refresh-cookie behavior.
5. Storage references for private files must use validated keys and short-lived access where applicable.
6. Audit events must keep actor, action, target, reason where required, and request metadata.
7. Cache behavior must define invalidation ownership before caching critical reads.

## Consequences

- R-014 docs can close documentation tasks only when they point to current implementation owners and list remaining verification gaps.
- Refactors that move business logic must still land with regression evidence in the same domain.
- Operational runbooks must prefer reversible actions and prohibit production data resets.
