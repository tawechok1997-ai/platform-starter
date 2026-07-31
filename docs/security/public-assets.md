# Public Asset Security

Updated: **2026-07-31**  
Owner: **Platform Security / Member Web**  
Status: **Active**  
Verification: `node tools/audit-public-assets.mjs`

## Policy

Files under a web application's `public/` directory are internet-accessible release inputs. They are not exempt from security review merely because they are generated, minified or copied from a reference site.

## Allowed content

- owned images, icons and fonts with a known purpose
- static documents intentionally published by the application
- generated manifests whose source and generation command are recorded

## Prohibited content

- copied third-party JavaScript or HTML entrypoints
- source maps
- secret-bearing files
- filenames generated from `undefined` or `null`
- executable artifacts without an owner and build contract

## Legacy reference assets

The historical roots below contain copied reference material:

- `apps/web-member/public/assets/asset-pc/`
- `apps/web-member/public/assets/asset-mobile/`

Executable extensions in these roots are quarantined by Member middleware and return 404. Images remain temporarily available while they are migrated into owned folders.

New product code must not import or execute legacy bundles. Extract only the required visual asset and record its owner, source and intended route.

## Required checks

`node tools/audit-public-assets.mjs` verifies:

- malformed `undefined`/`null` filenames are absent
- executable public files exist only in quarantined legacy roots
- source maps are absent
- Member middleware retains the quarantine contract
- executable artifacts are not empty

The Build workflow runs this audit before compilation.

## Migration target

1. Inventory referenced images.
2. Copy approved assets into owned, semantic folders.
3. Update application references.
4. Delete unused legacy files from the current tree.
5. Perform a separately approved Git-history cleanup using the repository-size migration runbook.

History rewriting is an operational migration, not a normal feature PR.
