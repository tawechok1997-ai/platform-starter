# Admin Browser Regression Matrix

> Source and deployed-browser contract · 2026-07-24
>
> Config: `playwright.admin-matrix.config.ts`
>
> Suite: `tests/admin-browser-matrix/admin-route-role-viewport.spec.ts`
>
> Workflow: `.github/workflows/admin-browser-regression-matrix.yml`

## Purpose

Verify that Admin route permissions and responsive behavior remain aligned across representative roles and viewports without using production mutations or creating permanent test accounts.

The suite installs a fake in-browser Admin session and intercepts `/api/admin/**` with read-only fixtures. It exercises the deployed Admin frontend while keeping finance, invitation, provider and settings mutations unreachable.

## Viewports

| Project | Width × height | Contract |
|---|---:|---|
| Desktop | 1440 × 900 | Full sidebar and desktop content geometry |
| Tablet | 834 × 1112 | Collapsed/mobile navigation boundary and mid-width wrapping |
| Mobile | 390 × 844 | Full mobile navigation, safe wrapping and no horizontal overflow |

## Roles

| Role fixture | Permissions represented |
|---|---|
| Owner | `*` |
| Finance | Deposit, withdrawal, wallet and reports view/export |
| Risk | `risk.view` |
| Support | Member/support view and reply |
| Read-only | `admin.access.view` |

These are deterministic browser fixtures, not claims about seeded production accounts.

## Route matrix

| Route | Owner | Finance | Risk | Support | Read-only |
|---|---:|---:|---:|---:|---:|
| `/dashboard` | Allow | Allow | Allow | Allow | Allow |
| `/operations` | Allow | Allow | Allow | Allow | Allow |
| `/topups` | Allow | Allow | Deny | Deny | Deny |
| `/withdrawals` | Allow | Allow | Deny | Deny | Deny |
| `/risk-alerts` | Allow | Deny | Allow | Deny | Deny |
| `/support-center` | Allow | Deny | Deny | Allow | Deny |
| `/audit` | Allow | Deny | Deny | Deny | Allow |
| `/admin-invitations` | Allow | Deny | Deny | Deny | Deny |
| `/webhook-logs` | Allow | Deny | Deny | Deny | Deny |

With five roles, nine routes and three viewports, one workflow run produces 135 route checks.

## Assertions per route

- Admin shell renders and the browser is not redirected to Login.
- Allowed routes do not render the Access Denied state.
- Denied routes render the shared Access Denied state.
- Document width does not exceed viewport width by more than 2 pixels.
- No page error, console error, critical request failure or critical HTTP response occurs.
- Owner routes emit full-page screenshots as evidence.

## Interaction assertions

- Tablet and mobile Dashboard open the Admin navigation and close it with Escape.
- Owner Operations opens the shared detail drawer.
- Drawer initial focus lands on Close.
- Escape closes the drawer.
- Focus returns to the Details trigger.

## Passing evidence

Verification PR: `#148` (`verify/admin-browser-matrix-20260724`)

- Workflow run: `30036250614`
- Job: `89304839529` — `Route × Role × Viewport`
- Result: success
- Matrix JSON files: 15
- Route checks: 135
- Permission expectation/render mismatches: 0
- Runtime and critical network issues: 0
- Maximum horizontal overflow: 0 px
- Owner full-page screenshots: 27
- Artifact ID: `8575441418`
- Artifact name: `admin-browser-matrix-a0537e372f976b5f582b1e05386b9e2fb5d7cd2c`
- Artifact size: 11,040,091 bytes
- Artifact digest: `sha256:7cb2e993decef4f1d625642bc8a4d788996053aa8fa4241f5bed326ced36a6c1`
- Artifact expiry: 2026-08-06

The verification PR contains only a workflow-trigger marker and must not be merged.

## Evidence contents

- Per-role JSON results for every Playwright project.
- Owner route screenshots.
- Failure screenshots and traces when a future run fails.
- HTML Playwright report.

Artifacts are retained for 14 days.

## Limits

- Mocked API fixtures verify frontend permission routing and responsive contracts, not backend authorization behavior. Backend permission metadata remains covered separately by `audit:admin-permissions` and API tests.
- The suite is read-only and does not verify mutation success.
- Changes to route permissions, Admin navigation, responsive shell behavior or shared drawers must update this matrix and pass the workflow again.
