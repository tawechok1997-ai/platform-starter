# Repository Size Migration

Updated: **2026-07-31**  
Owner: **Platform Engineering / Release Management**  
Status: **Planned operational migration**

The repository has a large historical binary and copied-reference footprint. Cleaning only the current tree does not reduce existing clone history. History rewriting must be handled as a coordinated migration rather than hidden inside a normal code PR.

## Preconditions

- owner approval
- protected backup mirror
- list of active branches and open pull requests
- asset manifest and current runtime reference audit
- maintenance window and developer communication
- rollback mirror and restoration test

## Target state

- runtime images stored in an approved CDN/object store or intentionally retained under semantic owned folders
- generated/copy-only bundles absent from Git history
- large binaries retained through Git LFS only when source control is genuinely required
- build output and third-party site bundles excluded from future commits

## Procedure

1. Freeze merges and record the approved `main` SHA.
2. Create a mirror backup and verify objects can be restored.
3. Produce a size report by path and object.
4. Confirm every removal candidate has no runtime, evidence or legal retention requirement.
5. Use `git filter-repo` against an isolated mirror.
6. Re-clone the rewritten repository and run full verification.
7. Force-update the remote only during the approved window.
8. Require all developers and automation to re-clone.
9. Close or recreate stale pull requests from the new history.
10. Retain the old mirror for the approved rollback period.

## Stop conditions

Stop if any removed path is still referenced, evidence retention is unclear, CI cannot reproduce the release, deployment identity differs, or rollback restoration has not been tested.

## Verification

- fresh clone size and duration
- `pnpm install --frozen-lockfile`
- `pnpm check:full`
- `node tools/audit-public-assets.mjs`
- API startup/health/version verification
- Admin and Member browser smoke and visual regression
- deployment commit identity

This runbook intentionally does not execute the history rewrite. That operation affects every clone and open branch and therefore requires explicit operational approval.
