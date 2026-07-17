# Backend Decomposition Review Checklist

Use this checklist for every controller or service split recorded by the backend decomposition inventory.

## Before editing

- Capture the current candidate entry from `pnpm audit:backend-decomposition:json`.
- Identify API routes, permissions, transactions, audit writes, provider calls, and stable error codes owned by the class.
- Add or confirm characterization tests for the affected flow.
- Confirm the proposed split follows `backend-decomposition-policy.md` and does not introduce a pass-through layer.

## Required review evidence

- [ ] Public API contract is unchanged or intentionally versioned.
- [ ] Permission checks remain at the transport or application boundary.
- [ ] Transaction boundaries remain explicit and atomic.
- [ ] Audit metadata and actor identity are preserved.
- [ ] Prisma access does not escape the approved repository boundary.
- [ ] No circular dependency or cross-module deep import was added.
- [ ] Relevant unit or integration tests cover the extracted behavior.
- [ ] `pnpm typecheck:api` passes.
- [ ] `pnpm check:architecture` passes.
- [ ] `pnpm audit:backend-decomposition:json` shows no new candidate and no severity increase.

## Baseline update rule

Update `backend-decomposition-baseline.json` only after the review evidence above is retained. Removing a candidate from the baseline requires a commit SHA and a link to the relevant test or verification evidence.

## Completion record

Record:

- candidate key
- before and after metrics
- owner
- commit SHA
- tests executed
- remaining risk
- rollback path
