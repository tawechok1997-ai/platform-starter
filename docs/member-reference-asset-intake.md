# Member Reference Asset Intake

Use this process when the missing reference PNG binaries are received.

## Expected files

The canonical filenames and roles live in `docs/member-reference-assets.manifest.json`.

Current expected files:

- `a426b420-d905-4a61-bac3-fb9f69b57901.png` — promotion card
- `eb8a2aa7-d675-4bc0-bd1f-64e25aba8ffe.png` — event card
- `009138d7-8a4f-44ef-a315-49d300f6f6e1.png` — announcement/news card
- `e6a882fe-0528-48d5-9707-8e563f1aeb96.png` — promotion theme image

A filename alone is not evidence that the binary is authentic. Do not generate placeholder images under these names.

## Verification

Place all received files in one temporary directory and run:

```bash
node tools/verify-member-reference-assets.mjs /path/to/received-assets
```

For machine-readable output:

```bash
node tools/verify-member-reference-assets.mjs /path/to/received-assets --json
```

The verifier checks:

- every required filename exists
- each path is a regular file
- each file is at least 1 KiB
- each file has the PNG signature
- each file has a unique SHA-256 checksum
- a checksum matches when the manifest contains an approved checksum

The command exits with a non-zero status until all files pass.

## Approval sequence

1. Receive the original binaries through an approved file-transfer channel.
2. Run the verifier from a clean temporary directory.
3. Review the images visually and confirm each role.
4. Record approved SHA-256 values in the manifest.
5. Run the verifier again so checksum matching is enforced.
6. Import the files through the existing CMS asset transport or the repository asset path selected by the owning component.
7. Run Member unit, typecheck, build and visual/browser regression checks.
8. Open a dedicated PR containing only the approved assets, manifest checksums and integration changes.

## Rejection conditions

Reject an intake when:

- a required file is missing
- a file has the wrong signature despite a `.png` extension
- two roles contain the same binary unexpectedly
- a received binary changes after approval
- the file is a screenshot, recreated placeholder or compressed substitute rather than the requested source binary
- the role cannot be confirmed visually

## Security notes

- Never execute scripts bundled with received assets.
- Do not upload archives directly into public assets without extracting and reviewing their contents.
- Preserve the original binaries unchanged; create optimized derivatives separately.
- Do not remove metadata or recompress the source files before recording their approved checksums.
