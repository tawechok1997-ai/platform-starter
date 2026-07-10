# GitHub Actions Smoke Workflow

Workflow: `.github/workflows/smoke.yml`

ใช้สำหรับกดรัน smoke test หลัง deploy API หรือหลังแก้ production environment และมี scheduled smoke สำหรับเฝ้า API อัตโนมัติ

## Scheduled smoke

Workflow รันอัตโนมัติทุกวัน:

```txt
01:00 UTC
```

Scheduled run จะทำ quick smoke เท่านั้น:

- anonymous smoke checks
- admin token checks ถ้ามี `PROD_ADMIN_TOKEN`
- ไม่รัน full production env verification
- ไม่รัน member token checks อัตโนมัติ

API URL สำหรับ scheduled run resolve ตามลำดับนี้:

```txt
1. PROD_API_URL secret
2. https://api-service.up.railway.app fallback
```

แนะนำให้ตั้ง secret นี้ใน GitHub:

```txt
PROD_API_URL=https://api-service.up.railway.app
```

## How to run manually

1. Open GitHub repository
2. Go to Actions
3. Select `Smoke API`
4. Click `Run workflow`
5. Set `api_url`
6. Choose quick mode or full verification mode
7. Choose whether to run admin/member token checks
8. Run

## Workflow inputs

```txt
api_url
run_env_verification
run_admin_checks
run_member_checks
```

Recommended quick smoke:

```txt
run_env_verification = false
run_admin_checks = false or true if PROD_ADMIN_TOKEN is fresh
run_member_checks = false or true if PROD_MEMBER_TOKEN is fresh
```

Recommended full production verification:

```txt
run_env_verification = true
run_admin_checks = true
run_member_checks = true
```

## Modes

### Quick smoke mode

Use this after a normal deploy when you only want to confirm the API is reachable and protected endpoints still require auth.

Requirements:

- `api_url`
- optional `PROD_ADMIN_TOKEN`
- optional `PROD_MEMBER_TOKEN`

Set:

```txt
run_env_verification = false
```

### Full verification mode

Use this after changing production env such as Redis, R2/S3, URLs, auth keys, or storage config.

Requirements:

- all required production env secrets
- optional Redis/storage secrets depending on your setup
- fresh admin/member tokens if token checks are enabled

Set:

```txt
run_env_verification = true
```

## Token check behavior

Admin/member token checks are safe to leave enabled.

If the matching token secret is missing, the workflow prints a skip message and exits that step successfully:

```txt
Skipping admin smoke checks because PROD_ADMIN_TOKEN is not set.
Skipping member smoke checks because PROD_MEMBER_TOKEN is not set.
```

If the token secret is set but expired or invalid, the smoke check runs and should fail. Refresh the token secret and rerun the workflow.

## Required repository secrets

ใช้ได้ทั้งแบบครบ production verification หรือใส่เฉพาะ token สำหรับ smoke check

### Base URL secret

```txt
PROD_API_URL
```

### Production env verification secrets

```txt
PROD_DATABASE_URL
PROD_JWT_ACCESS_KEY
PROD_ADMIN_JWT_ACCESS_TTL
PROD_ADMIN_REFRESH_TTL_HOURS
PROD_MEMBER_WEB_URL
PROD_ADMIN_WEB_URL
PROD_PRIVATE_MEDIA_DIR
```

### Redis / storage secrets

```txt
PROD_REDIS_URL
PROD_STORAGE_DRIVER
PROD_S3_ENDPOINT
PROD_S3_REGION
PROD_S3_BUCKET
PROD_S3_ACCESS_KEY_ID
PROD_S3_SECRET_ACCESS_KEY
PROD_S3_FORCE_PATH_STYLE
```

### Smoke token secrets

```txt
PROD_ADMIN_TOKEN
PROD_MEMBER_TOKEN
```

## Token notes

`PROD_ADMIN_TOKEN` and `PROD_MEMBER_TOKEN` are short-lived access tokens. If they expire, the token checks will fail even if the API is healthy.

For quick post-deploy checks:

1. Login as admin
2. Copy current access token from browser storage/devtools
3. Update `PROD_ADMIN_TOKEN`
4. Run workflow

Same idea for member token.

## What it runs

The workflow can run:

```bash
scripts/verify-production-env.sh
scripts/smoke-api.sh
```

`verify-production-env.sh` only runs when `run_env_verification` is enabled manually.

Smoke checks cover:

- public health/version
- protected admin endpoints without token
- protected member endpoints without token
- admin pagination endpoints with token
- admin security/session endpoint with token
- member wallet/topup/withdrawal endpoints with token

## Expected result

The workflow should finish green with:

```txt
Smoke result: <n> passed, 0 failed
```

If token checks fail because a token expired, refresh the token secret and rerun the workflow.

## Safe behavior

The smoke workflow avoids business operations that change money balances or request statuses. It is intended for post-deploy confidence checks, not full end-to-end financial testing.
