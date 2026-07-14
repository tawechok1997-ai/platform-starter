# R-010 Progress

Status: 🟡 ACTIVE

Started: 2026-07-15

## Scope

R-010 closes backend service decomposition and coupling boundaries after R-007 audit-writer standardization, R-008 domain-policy separation, and R-009 repository/transaction closure.

The goal is to reduce oversized and high-coupling controllers/services without changing public routes, permissions, transaction semantics, idempotency, audit payloads, provider behavior, finance behavior, or error contracts.

## Definition of done

- [ ] Produce a stable inventory of oversized/high-coupling controllers and services.
- [ ] Classify every current candidate with a durable review decision.
- [ ] Define a ratchet that rejects new or worsened decomposition debt.
- [ ] Split critical candidates behind existing interfaces and routes.
- [ ] Keep transaction owners and repository boundaries established by R-009 intact.
- [ ] Preserve current DTO, response, permission, audit, and error contracts.
- [ ] Add focused regression coverage for every extracted command/query component.
- [ ] Enable strict R-010 enforcement in required CI.
- [ ] Record successful API build/deployment after the final migration.

## Execution order

1. Inventory foundation and stable candidate keys.
2. Review ledger and severity prioritization.
3. Critical candidates.
4. High-severity candidates.
5. Moderate candidates or documented exceptions.
6. Strict ratchet and closure evidence.

## Safety rules

- Do not split a transaction across services.
- Do not move Prisma writes outside the current transaction owner.
- Do not duplicate API routes or business validation.
- Do not change production schema, data, secrets, permissions, provider configuration, or money behavior.
- Extract by use case or cohesive responsibility, not merely by line count.

## Current progress

- [x] Renamed the decomposition inventory output to R-010 while retaining the legacy R007 JSON alias for compatibility.
- [x] Added stable candidate keys using `<file>#<kind>`.
- [x] Added critical/high/moderate severity classification.
- [x] Added deterministic candidate ordering and severity totals.
- [ ] Run the inventory and persist the current candidate review ledger.
- [ ] Select the first critical candidate for decomposition.

## Evidence

- `tools/audit-backend-decomposition.mjs`
- inventory foundation commit `c779ce60d87d3e2943b4903333017e58fbeb3065`

## Count

- Total R-010 closure outcomes: 9
- Closed: 1
- Remaining: 8
