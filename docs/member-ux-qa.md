# Member UX QA Checklist

Use this checklist after member mobile UX/UI changes.

## Scope

Member pages covered by this checklist:

```txt
/deposit
/withdraw
/transactions
/bank-accounts
```

## Build check

```bash
pnpm build:web-member
```

For full verification:

```bash
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
pnpm test:e2e:smoke
```

## Mobile viewport baseline

Test at least:

```txt
iPhone width: 390px
Small Android width: 360px
Desktop width: 1280px
```

Verify globally:

```txt
- no horizontal scroll
- touch targets feel easy to tap
- long IDs / notes / account numbers wrap safely
- notices are visible after user action
- disabled buttons clearly communicate pending state
- forms do not submit without required data
```

## Deposit page

Open:

```txt
/deposit
```

Verify:

```txt
- loading notice appears while initial data loads
- amount shortcut buttons are easy to tap
- custom amount input works
- disabled payment methods look disabled
- selected payment method is clear
- next button shows loading state
- receiving account card is readable
- account number / promptpay copy buttons work
- slip file upload accepts image only
- slip preview fits mobile width
- submit button is disabled or blocked without slip
- after submit, waiting state is shown
- new topup appears in history
```

## Withdraw page

Open:

```txt
/withdraw
```

Verify:

```txt
- wallet available balance loads
- locked balance and wallet status are readable
- approved bank account selector works
- empty approved account state links to /bank-accounts
- selected account box is readable
- copy account number works
- submit button is disabled when no active account exists
- submit shows loading state
- success notice appears after request
- new withdrawal appears in history
```

## Transactions page

Open:

```txt
/transactions
```

Verify:

```txt
- loading notice appears
- credit and debit entries are visually distinct
- amount does not push layout sideways
- balance before/after cards are readable
- long references do not overflow
- empty state is shown when there are no transactions
```

## Bank accounts page

Open:

```txt
/bank-accounts
```

Verify:

```txt
- loading notice appears
- add-bank form is readable on mobile
- bank dropdown works
- account name and account number inputs work
- validation appears when required fields are missing
- submitted account shows pending/active/rejected status
- primary badge is visible
- set primary button is easy to tap when available
- admin note wraps safely
```

## Production integration notes

### Redis rate limit

If Redis is enabled:

```bash
API_URL="https://api-service.up.railway.app" \
./scripts/verify-production-env.sh
```

Then run smoke:

```bash
API_URL="https://api-service.up.railway.app" \
ADMIN_TOKEN="<admin-access-token>" \
./scripts/smoke-api.sh
```

Manual rate limit test:

```bash
for i in {1..15}; do
  curl -i -X POST "$API_URL/admin/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"wrong","password":"wrong"}'
done
```

Expected when enabled:

```txt
HTTP 429 Too Many Requests
```

If Redis is not enabled for the current deployment, mark this as:

```txt
N/A, Redis is not enabled
```

### R2/S3 slip storage

If S3/R2 storage is enabled:

```env
STORAGE_DRIVER=s3
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=<bucket-name>
S3_ACCESS_KEY_ID=<access-key-id>
S3_SECRET_ACCESS_KEY=<secret-access-key>
S3_FORCE_PATH_STYLE=true
```

Verify:

```txt
- member uploads a new slip from /deposit
- object appears in bucket under slips/YYYY-MM-DD/<uuid>.<ext>
- admin opens /topups
- slip preview loads without 404/500
```

If S3/R2 is not enabled for the current deployment, mark this as:

```txt
N/A, S3/R2 storage is not enabled
```
