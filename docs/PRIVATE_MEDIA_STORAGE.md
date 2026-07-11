# Private Media Storage

Private media is used for member top-up slips. The member app uploads the image to the API, the API stores it outside the public web roots, and the admin app reads it through an authenticated admin endpoint.

## Current flow

- Member uploads a slip on `/deposit`.
- API endpoint `POST /member/topups/slip` stores the image in `PRIVATE_MEDIA_DIR`.
- The top-up request note stores only `slipFileId`, `slipImageName`, `storage`, and `userNote`.
- Admin endpoint `GET /admin/topups/:id/slip` reads the private file after admin auth.
- Admin `/topups` page displays the slip from the secure endpoint.

## Railway production setup

Use a persistent Railway Volume for private media. Do not rely on `/tmp` in production because files can disappear after restart or redeploy.

Recommended environment variable for the API service:

```env
PRIVATE_MEDIA_DIR=/app/private-media/topup-slips
```

Mount the Railway Volume so `/app/private-media` is persistent.

## Local development

If `PRIVATE_MEDIA_DIR` is not set, the API falls back to:

```text
/tmp/platform-private-media/topup-slips
```

That fallback is useful for local testing only.

## Validation rules

Current first-pass validation:

- Accepts `image/jpeg`, `image/jpg`, `image/png`, and `image/webp` data URLs.
- Rejects empty images.
- Rejects images larger than 1.5 MB after compression/upload.
- Stores the file with an internal random `slipFileId`.

## Legacy base64 notes

Older top-up requests may still have `slipImageData` inside `note`. The admin UI still supports reading old base64 slips while new slips use `slipFileId`.

Cleanup plan:

1. Export old top-up requests whose `note` contains `slipImageData`.
2. Convert each base64 slip to a private file.
3. Replace the note with `slipFileId`, `slipImageName`, `storage: "private"`, and `userNote`.
4. Keep a backup export until finance reconciliation is confirmed.

## Security notes

- Do not expose the private media folder through Next.js static files.
- Do not put private media under any public asset directory.
- Keep `GET /admin/topups/:id/slip` behind `AdminAuthGuard`.
- Avoid logging the base64 content or full data URLs.
- Storage keys are validated server-side and reject absolute paths, traversal segments, backslashes, and unsupported formats before local or S3 access.
