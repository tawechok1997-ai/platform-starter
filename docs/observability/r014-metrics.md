# R-014 Metrics Baseline

## Runtime endpoint

`GET /metrics` returns a JSON snapshot generated from in-process counters. It intentionally avoids raw SQL, request bodies, tokens, cookies, and actor usernames.

## HTTP latency and error-rate metrics

HTTP request completion records are aggregated by:

- `module`
- `action`
- `result`

Each bucket reports:

- `count`
- `errors`
- `avgDurationMs`
- `maxDurationMs`

These buckets provide the request latency and error-rate baseline required by R-014.

## Tracked failure metrics

The snapshot also keeps a `trackedFailures` section for high-risk failure categories:

- admin login/auth failures
- member login/auth failures
- provider webhook/callback failures
- top-up, withdrawal, transfer, and settlement-related failures

Each tracked failure bucket reports count, last HTTP status code, and last-seen timestamp.

## Database query performance metrics

Prisma query-performance signals are aggregated from the existing query monitor and reported by:

- signal kind: `slow-query` or `n-plus-one-burst`
- query fingerprint
- count
- max duration for slow-query signals
- threshold/window metadata
- last-seen timestamp

Raw SQL is not exported; only fingerprints and timing metadata are retained.

## Current limitations

- Metrics are process-local and reset on restart.
- The endpoint is a baseline/reporting surface, not a durable metrics backend.
- A production exporter can be added later once the deployment metrics sink is chosen.
