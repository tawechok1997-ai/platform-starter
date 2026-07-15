# P6 Test Account Seeding

## Purpose

Create or reset three dedicated P6 regression accounts without storing plaintext passwords in the repository:

- full-access Admin;
- read-only Admin;
- Member with an active THB wallet and profile.

The seeder is idempotent. Running it again updates passwords and account status, repairs role assignments, and revokes existing sessions for the seeded accounts.

## Prerequisites

Run the normal schema and baseline seeds first:

```bash
pnpm db:migrate
pnpm db:seed
pnpm db:seed:access
```

## Required variables

```text
P6_ADMIN_EMAIL
P6_ADMIN_PASSWORD
P6_READONLY_ADMIN_EMAIL
P6_READONLY_ADMIN_PASSWORD
P6_MEMBER_EMAIL
P6_MEMBER_PASSWORD
```

Passwords must contain at least 12 characters. All three email addresses and usernames must be unique.

Optional variables:

```text
P6_ADMIN_USERNAME=p6-admin
P6_READONLY_ADMIN_USERNAME=p6-readonly
P6_MEMBER_USERNAME=p6-member
P6_MEMBER_DISPLAY_NAME=P6 Test Member
```

## Validate configuration without writing to the database

```bash
pnpm db:seed:p6:check
```

## Seed or reset the accounts

```bash
pnpm db:seed:p6
```

The command prints only the three account email addresses. It never prints plaintext passwords or password hashes.

## Production safety

The seeder refuses to run when `NODE_ENV=production` unless this explicit override is present:

```text
P6_ALLOW_PRODUCTION_ACCOUNT_SEED=true
```

Use the override only for a controlled test environment whose runtime happens to use `NODE_ENV=production`. Never seed these accounts into a live customer database.

## Created access

- The full Admin receives the existing `super_admin` role.
- The read-only Admin receives the managed `p6_readonly` role containing view permissions only. Any `super_admin` or `owner` assignment on that account is removed.
- The Member is activated, email-verified for testing, and receives an active THB wallet and profile.

After the seeder runs, use the same email/password values as GitHub Actions secrets for the P6 readiness and authenticated regression workflows.
