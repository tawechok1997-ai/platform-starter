# Promotion Center Lifecycle Evidence

> Verified against `main` on 2026-07-24.

## Implemented scope

- Campaign lifecycle: `draft`, `published`, `archived`
- Backward compatibility for legacy campaigns that only contain `enabled`
- Published campaigns can be enabled for Member visibility
- Archived campaigns are disabled automatically
- Search by title, campaign ID and badge text
- Lifecycle filtering
- Select visible campaigns and bulk archive
- Shared confirmation dialog before bulk archive
- Shared confirmation dialog before discarding unsaved edits on reload
- Unsaved-changes protection and save-state badge
- Loading and saving states released through `finally` blocks
- Member preview restricted to published and enabled campaigns
- Validation applied to published campaigns

## Regression protection

`apps/web-admin/src/features/cms/promotion-center-page.spec.ts` verifies:

- lifecycle values and legacy normalization
- search and lifecycle filtering
- bulk archive confirmation
- Member preview visibility boundary
- unsaved-changes protection
- shared reload/discard confirmation
- absence of native `window.confirm`
- loading and saving cleanup

`apps/web-admin/src/features/cms/promotion-center-lifecycle.behavior.spec.ts` executes the production normalizer and verifies:

- legacy enabled campaigns remain published after JSON round trip
- archived campaigns remain hidden after JSON round trip
- disabled legacy campaigns remain draft after JSON round trip

## Verification

Lifecycle implementation verification:

- PR `#177` (marker-only, not merged)
- Quality Gate run `30051260657`: success
- Build run `30051260680`: success
- Full-System run `30051260698`: success
- Artifact ID `8581170093`
- Digest `sha256:b24230dfd3075cc01bba43fd4cae9e869b0fc4e2168d56538130e8af63013dd2`

Shared reload confirmation verification:

- PR `#182` (marker-only, not merged)
- Quality Gate run `30052339878`: success
- Build run `30052339787`: success
- Full-System run `30052340132`: success
- Artifact ID `8581561140`
- Digest `sha256:c321cb2409d2dba5c0dc03e14e1e840148cc68fa8b238ee9438a610c58048cab`

Lifecycle round-trip behavior verification:

- PR `#184` (marker-only, not merged)
- Quality Gate run `30052821197`: success
- Build run `30052821275`: success
- Full-System run `30052821235`: success
- Artifact ID `8581722294`
- Digest `sha256:7151cc8571c7ee78221828f8994e11f2be32f52b2e68ea589e247227eb92ad3f`
- P5 Security Audit: success
- Architecture Contracts: success

## Relevant commits

- Lifecycle/search/bulk archive implementation: `8956701d70c89a9d2bfb79ef609f0062b7e12c22`
- Optional date contract fix: `e2db890300b1e0dcb616812382d276cc64e9e773`
- Regression specification: `132fc76f7ea452968f754e00438868b5609b72e4`
- Complete type hardening: `08016b6cebccf7f91b334c7e07e8364b250a4c95`
- Shared reload confirmation and async cleanup: `378cad48f0e6dcb735ac7de24308aaae09bfcb01`
- Shared confirmation regression guard: `b56e05772a678fce02aa40a67f4872565d1e2f4b`
- Lifecycle round-trip behavior tests: `f9cb07a21ed250fd246cbc2dda6b881688d10cfe`
- Canonical worklist sync: `b63d8ef297ee843c54d67c22555390335e8c61e5`

## Remaining Promotion Center scope

- Browser interaction evidence on deployed mobile/tablet for search, selection and confirmation
- Consider server-side campaign storage instead of a single settings payload if campaign volume grows substantially
