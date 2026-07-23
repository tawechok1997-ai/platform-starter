# Content Center Lifecycle Evidence

> Verified against `main` on 2026-07-24.

## Implemented scope

- Shared CMS lifecycle contract: `draft`, `published`, `archived`
- Backward compatibility: legacy records with `enabled=true` normalize to `published`
- Draft and archived records normalize to `enabled=false`
- Member mobile/desktop previews only render published and enabled content
- Lifecycle controls for Banner, Popup, Announcement and FAQ
- Published/draft/archived metrics
- Editable Advanced Raw JSON with parsing and normalization before applying
- Invalid Raw JSON produces a safe validation message
- Unapplied Raw JSON participates in the unsaved-changes/navigation guard
- Shared confirmation dialog before discarding form or Raw JSON edits
- Loading, saving, upload and delete paths release busy state through `finally`
- Existing private asset upload, MIME/size validation, storage metadata and usage-before-delete guard remain enforced

## Regression protection

`apps/web-admin/src/features/cms/content-center-contract.spec.ts` executes the production contract and verifies:

- legacy published records survive JSON round trip
- archived records remain hidden
- lifecycle patches control Member visibility
- malformed JSON is rejected
- valid JSON is normalized before use

`apps/web-admin/src/features/cms/content-center-page.spec.ts` verifies adoption of:

- lifecycle editor controls
- published-only preview boundary
- editable Raw JSON apply/reset flow
- unapplied Raw JSON dirty guard
- shared reload confirmation and absence of native `window.confirm`
- async `finally` cleanup
- private asset upload and usage guards

## Verification

Final verification PR: `#188` (marker-only, not merged)

- Quality Gate run `30054311186`: success
- Build run `30054311155`: success
- Full-System run `30054311176`: success
- P5 Security Audit: success
- Architecture Contracts: success

Full-System artifact:

- Artifact ID: `8582256797`
- Digest: `sha256:ed0824e677e5037ef1e03f45afe200b9f9b33da414a3ef21931e06e770d86af8`
- Expires: 2026-08-06

The first verification PR `#185` failed because its snapshot also contained an unrelated Growth optional-property type mismatch. That mismatch was fixed on `main` by commit `e8835290e38de90a1d7ee442b7c2240e3d5bcec2`. A diagnostic typecheck against the current merge state passed before final verification.

## Relevant commits

- CMS lifecycle contract: `50c02da476f58443d702eb3709874cbead9798b4`
- Lifecycle editor and editable Raw JSON: `12088ba45bc29ab1f26b71f87bca5643bbc351db`
- Lifecycle/JSON behavior tests: `db4c2fa3a982743635db4ace3a85f2f046c9a08a`
- Unapplied Raw JSON dirty guard: `28ca5247c28b8b43d51cd9d82361a5b5be5a892a`
- Source adoption guard: `3eebf19bd3461efaca6e9193b3951041a6d1dde8`
- Diagnostic workflow cleanup: `94a56a469aa0edf08402aa145ccfeeacd8a734d9`

## Remaining Content Center scope

- Browser interaction evidence on deployed mobile/tablet for lifecycle controls and Raw JSON confirmation
- Consider dedicated CMS records instead of a single settings payload if content volume or editorial concurrency grows substantially
