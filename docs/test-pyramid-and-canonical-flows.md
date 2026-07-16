# Test Pyramid and Canonical Flows

This document defines the permanent test layers and the minimum end-to-end flows required before release.

## Test layers

### 1. Unit tests

Fast, deterministic tests for pure domain logic, validation, formatting, mapping and state transitions.

- No network access
- No real database
- No shared mutable state
- Must run on every pull request

### 2. Integration tests

Tests for repositories, transactions, database constraints, Redis behavior, storage adapters and provider adapters.

- Use isolated test resources
- Verify rollback and idempotency
- Verify database uniqueness and foreign-key behavior
- Must not depend on production credentials

### 3. Contract tests

Tests for API request/response schemas, error codes, provider signatures and webhook payload compatibility.

- Consumer and provider expectations must be explicit
- Breaking contract changes require versioning or coordinated rollout
- Sensitive fields must never appear in public responses

### 4. Component tests

Tests for Admin and Member UI states without requiring the complete deployed system.

Required states:

- loading
- empty
- success
- validation error
- permission denied
- provider unavailable
- retry and duplicate submission protection

### 5. End-to-end tests

Browser tests for complete user-visible workflows across Web, API and persistence.

- Use seeded non-production accounts
- Record screenshots, traces and videos on failure
- Run destructive flows only in isolated environments
- Never use real money or production member accounts

### 6. Production smoke tests

Read-only or explicitly safe checks after deployment.

- health and version identity
- login boundary and cookie configuration
- static asset delivery
- read-only navigation
- provider connectivity without financial mutation

Production smoke is not a replacement for staging end-to-end coverage.

## Canonical flows

### Authentication

1. Member login, refresh, logout and revoked-session rejection
2. Admin login with permission loading and session rotation
3. Password reset and rate-limit behavior
4. TOTP enrollment, verification and recovery-code handling
5. Permission downgrade invalidates cached authorization

### Deposit lifecycle

1. Create deposit intent
2. Validate amount and promotion eligibility
3. Receive verified provider callback
4. Apply one ledger mutation only
5. Ignore duplicate callbacks safely
6. Surface success, failure, timeout and reversal states
7. Reconcile provider and wallet totals

### Withdrawal lifecycle

1. Validate balance, KYC, risk and limits
2. Reserve funds transactionally
3. Approve or reject through authorized Admin workflow
4. Submit to provider once
5. Handle failure, retry and reversal
6. Release or settle reserved funds exactly once
7. Record audit and reconciliation evidence

### KYC and risk

1. Upload private document
2. Malware scan and storage policy enforcement
3. Reviewer decision with permission checks
4. Risk alert assignment and timeline update
5. Member-visible status without private reviewer data leakage

### Support and CMS

1. Create ticket with attachment
2. Verify private download authorization
3. Admin reply and status transition
4. Publish CMS content
5. Member receives updated content and notification safely

### Authorization regression

1. Read-only Admin cannot mutate
2. Hidden controls are also blocked by API authorization
3. Owner transfer requires explicit permission and audit entry
4. Reduced permissions invalidate stale sessions and caches

### Provider reliability

1. Invalid signature rejected
2. Duplicate webhook accepted idempotently without duplicate mutation
3. Provider timeout does not create unknown wallet state
4. Retry follows bounded backoff and idempotency keys
5. Reconciliation detects and reports mismatches

## Release gates

### Pull request gate

- runtime check
- lint
- typecheck
- unit tests
- affected integration and contract tests
- architecture audits

### Main branch gate

- complete build
- repository test profile
- migration validation
- browser smoke for affected applications

### Release candidate gate

- canonical authenticated flows in staging
- six-viewport visual regression
- migration and rollback rehearsal
- provider sandbox regression
- evidence artifacts linked to the approved commit

### Production gate

- approved commit identity
- migration status
- safe smoke checks
- observability dashboards and alerts active
- rollback owner identified

## Ownership

Each failing canonical flow must have one owning domain or application. Cross-team failures may have multiple contributors, but never zero owners.
