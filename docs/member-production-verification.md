# Member Production Verification

Production URL:

```text
https://platformweb-member-production.up.railway.app
```

The workflow `.github/workflows/member-production-verification.yml` verifies:

1. The Member home page returns HTTP 2xx.
2. `/api/version` returns HTTP 2xx.
3. The version response contains the expected full or 12-character commit SHA.
4. Evidence is uploaded for 14 days.

## Expected SHA rules

- Pull request: the target branch SHA, representing the production version expected before the PR is merged.
- Push to `main`: the pushed commit SHA, with retries for up to 15 minutes while Railway deploys.
- Manual run: optional `expected_sha` input, otherwise the workflow commit SHA.

The gate is read-only and does not call Member mutation endpoints.
