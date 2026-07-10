# Visual Regression Guide

## Scope

The visual suite currently covers public Member Web routes only, so it is safe to run without credentials or money-operation side effects.

Routes:

- `/login`
- `/register`
- `/maintenance`
- `/session-expired`
- `/legal`
- `/contact`

Viewports:

- 360x800
- 390x844
- 430x932
- 768x1024
- 1024x768
- 1440x900

This produces 36 screenshots per full run.

## Local commands

Generate or replace baseline screenshots:

```bash
MEMBER_WEB_URL="http://localhost:3000" pnpm test:e2e:visual:update
```

Compare the current UI with committed baseline screenshots:

```bash
MEMBER_WEB_URL="http://localhost:3000" pnpm test:e2e:visual
```

Run against the deployed Member Web:

```bash
MEMBER_WEB_URL="https://member-service.up.railway.app" pnpm test:e2e:visual
```

## GitHub Actions

Workflow: `E2E Visual Regression`

Inputs:

- `member_web_url`: deployed Member Web URL
- `update_baselines`: generate new snapshots when true, compare snapshots when false

Artifacts:

- `playwright-visual-report`
- `playwright-visual-results`

The results artifact includes generated baselines, failed screenshots and image diffs when available.

## Safe baseline process

1. Run the workflow with `update_baselines=true`.
2. Download the `playwright-visual-results` artifact.
3. Review every viewport before accepting the images.
4. Copy approved `*-snapshots` files into the repository.
5. Commit the approved baselines separately.
6. Run the workflow again with `update_baselines=false`.

Do not approve changed baselines merely to make CI green. A green check produced by blindly replacing screenshots is decorative rather than useful.

## Protected routes

Authenticated Member and Admin visual coverage is intentionally not enabled yet. Add it only with dedicated non-production test accounts, isolated data and read-only scenarios. Never use production credentials or approve/reject real money requests during visual tests.
