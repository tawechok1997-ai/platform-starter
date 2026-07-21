# Admin Form and Mutation Safety Contract

Updated: 2026-07-21  
Status: Active  
Scope: `apps/web-admin`

## Objective

Define one safe interaction contract for Admin forms and mutations before any framework migration. This contract applies to finance, risk, KYC, settings, support, providers, members and other privileged workflows.

## Core rules

1. Every mutation has an explicit pending state and blocks duplicate submission.
2. Destructive, irreversible or financially meaningful actions require confirmation.
3. Reject, hold, override, release, adjustment and destructive actions require a reason when the API contract supports one.
4. Raw backend messages are not parsed for control flow. Stable error codes drive UI behavior.
5. Validation errors move focus to the first invalid field and expose a summary for screen-reader and keyboard users.
6. Dirty forms warn before route change, close or replacement when data would be lost.
7. Permission, session expiry, conflict and partial-failure states are handled separately from ordinary validation.
8. Success feedback is not shown until the authoritative server response is received.
9. Mutations that may be retried must use an idempotency key or a server contract that guarantees equivalent protection.
10. Sensitive values remain masked in confirmation, error and audit summaries unless the permission contract explicitly allows disclosure.

## Standard mutation state model

- `idle`
- `validating`
- `confirming`
- `submitting`
- `succeeded`
- `validation_failed`
- `conflicted`
- `permission_denied`
- `session_expired`
- `partially_succeeded`
- `failed_retryable`
- `failed_terminal`

A control must not return to `idle` automatically after an ambiguous network failure. The user must be shown whether the outcome is unknown and given a safe reconciliation action.

## Validation behavior

### Client validation

Use client validation only for immediate, deterministic rules such as:

- required fields;
- local format and length;
- allowed enum selection;
- date ordering;
- attachment type and client-known size;
- confirmation text matching.

Client validation must not impersonate server authority for:

- balances;
- permissions;
- current ownership;
- account state;
- risk status;
- version conflicts;
- duplicate bank/provider/member records;
- final transaction eligibility.

### Error presentation

- Place field errors next to the relevant control.
- Provide one summary at the top when more than one field is invalid.
- Focus the first invalid control after submit.
- Use `aria-describedby` and stable error IDs.
- Keep entered values unless security requires clearing them.
- Never expose stack traces, SQL, secrets, tokens or internal identifiers.

## Confirmation requirements

Confirmation is mandatory for:

- approve/reject financial operations;
- wallet adjustment or release;
- member suspension, freeze or deletion;
- risk/watchlist override or release;
- role, permission or ownership changes;
- credential rotation;
- provider activation/deactivation;
- destructive CMS or promotion operations;
- bulk actions affecting multiple records.

The confirmation view must include:

- target identity;
- action and consequence;
- amount/currency when relevant;
- selected count for bulk actions;
- reason field when required;
- permission or policy warning;
- whether the operation can be reversed.

## Duplicate-submit protection

- Disable the submit control while a request is active.
- Keep one mutation promise per action instance.
- Ignore repeated Enter/key activation while pending.
- Prefer server idempotency for financial and provider mutations.
- Do not treat a client-side disabled button as sufficient protection.

## Dirty-state behavior

Warn before losing unsaved changes when:

- navigating to another route;
- closing a modal or drawer;
- switching an entity in a detail workspace;
- refreshing or closing the tab;
- replacing form data after a background refetch.

Do not warn after a successful save or when no meaningful field changed.

## Conflict handling

For `409`, version mismatch or ownership conflict:

1. Stop optimistic state.
2. Preserve user-entered reason and notes.
3. Fetch the current authoritative entity.
4. Explain what changed and by whom when available.
5. Offer review-and-retry, not blind replay.
6. Never silently overwrite a newer administrative decision.

## Partial failure

Bulk and multi-step operations must return per-item or per-step outcomes. The UI must show:

- succeeded count;
- failed count;
- skipped count;
- retryable items;
- permanent failures;
- audit/reference IDs where available.

A partial failure must never be presented as full success.

## Framework decision gate

React Hook Form and Zod may be adopted only after the inventory records:

- number and complexity of Admin forms;
- repeated validation and dirty-state implementations;
- bundle impact;
- adapter design for current primitives;
- migration order;
- test plan;
- rollback path.

Until then, new forms must follow this contract without introducing another form/state layer.

## Verification checklist

- keyboard-only submission and cancellation;
- first-invalid-field focus;
- screen-reader error summary;
- duplicate click and Enter protection;
- slow request and timeout;
- session expiry during submit;
- permission revoked during submit;
- version conflict;
- retry after ambiguous network failure;
- partial bulk failure;
- long Thai reason and long identifiers;
- mobile sticky actions and 200% zoom.
