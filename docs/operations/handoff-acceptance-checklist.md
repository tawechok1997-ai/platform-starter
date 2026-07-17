# Engineering Handoff Acceptance Checklist

Use this checklist when transferring ownership of repository work, incidents, releases, or unfinished priority items.

## Scope and ownership

- [ ] The owning worklist item and priority are identified.
- [ ] A named owner and next reviewer are recorded.
- [ ] Completed, blocked, and remaining work are separated.
- [ ] Assumptions and temporary exceptions are explicit.

## Code and architecture

- [ ] Changed modules, package boundaries, routes, migrations, and feature flags are listed.
- [ ] Stable API contracts and error codes affected by the work are documented.
- [ ] Security, finance, storage, provider, and audit implications are called out.
- [ ] Follow-up refactors are linked instead of hidden in prose.

## Verification evidence

- [ ] Commands executed are recorded with results.
- [ ] CI and deployment status are recorded for the final commit.
- [ ] Production or external verification evidence is sanitized and linked where required.
- [ ] Known failures are distinguished from blocked checks and unexecuted checks.

## Operations

- [ ] Rollback steps and rollback commit are provided.
- [ ] Required secrets, vendor access, dashboards, and runbooks are named without exposing credentials.
- [ ] Alert ownership and escalation paths are clear.
- [ ] Database migration and restore implications are documented.

## Acceptance

The receiving owner should reject the handoff when any critical behavior lacks an owner, verification evidence, rollback path, or an explicit risk decision.

Record:

- handoff date
- outgoing owner
- receiving owner
- final commit SHA
- accepted risks
- next milestone
