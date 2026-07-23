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
- Unsaved-changes protection and save-state badge
- Member preview restricted to published and enabled campaigns
- Validation applied to published campaigns

## Regression protection

`apps/web-admin/src/features/cms/promotion-center-page.spec.ts` verifies:

- lifecycle values and legacy normalization
- search and lifecycle filtering
- bulk archive confirmation
- Member preview visibility boundary
- unsaved-changes protection

## Verification

Verification PR: `#177` (marker-only, not merged)

- Quality Gate run `30051260657`: success
- Build run `30051260680`: success
- Full-System run `30051260698`: success
- P5 Security Audit: success
- Architecture Contracts: success

Full-System artifact:

- Artifact ID: `8581170093`
- Digest: `sha256:b24230dfd3075cc01bba43fd4cae9e869b0fc4e2168d56538130e8af63013dd2`
- Expires: 2026-08-06

## Relevant commits

- Lifecycle/search/bulk archive implementation: `8956701d70c89a9d2bfb79ef609f0062b7e12c22`
- Optional date contract fix: `e2db890300b1e0dcb616812382d276cc64e9e773`
- Regression specification: `132fc76f7ea452968f754e00438868b5609b72e4`
- Complete type hardening: `08016b6cebccf7f91b334c7e07e8364b250a4c95`

## Remaining Promotion Center scope

- Browser interaction evidence on production mobile/tablet
- Replace remaining native reload confirmation with the shared confirmation primitive
- Consider server-side campaign storage instead of a single settings payload if campaign volume grows substantially
