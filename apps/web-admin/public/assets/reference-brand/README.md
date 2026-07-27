# Reference Brand Asset Intake

This directory is the controlled landing zone for assets migrated from the approved reference package.

## Structure

- `brand/` logos, marks, favicon and share images
- `auth/` login/register backgrounds and decorative assets
- `navigation/` menu and category icons
- `home/` hero, announcement and section artwork
- `promotions/` campaign cards and banners
- `games/` game/provider placeholders only; real catalog assets remain in their existing source
- `social/` support and social channel icons

## Safety rules

1. Do not copy JavaScript, cookies, local storage values, API URLs or authentication code from the static package.
2. Do not commit executable SVG content without sanitizing it first.
3. Prefer lowercase kebab-case names and preserve a source-to-target mapping in the asset manifest.
4. Keep large source images out of runtime paths until compressed and dimension-checked.
5. Do not overwrite existing assets until consumers have a fallback and visual verification.
6. Every asset batch must be independently revertible.

The initial migration remains additive. Existing production assets stay as fallback until visual QA and build gates pass.
