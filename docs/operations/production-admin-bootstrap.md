# Production Admin bootstrap

A newly created PostgreSQL database contains no Admin account even after the Prisma schema is present. The API startup preparation therefore applies the idempotent core seeds and creates the first `super_admin` account only when `admin_users` is empty and a secure password is supplied through the environment.

## Railway variables

Preferred variables:

```env
BOOTSTRAP_ADMIN_USERNAME=admin
BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=<random password of at least 12 characters>
```

Supported password fallbacks, in priority order:

1. `BOOTSTRAP_ADMIN_PASSWORD`
2. `SEED_ADMIN_PASSWORD`
3. `P6_ADMIN_PASSWORD`
4. `DEFAULT_ADMIN_SECRET`

Username and email also accept `SEED_ADMIN_*` and `P6_ADMIN_*` aliases. When no identity variables are provided, the first account uses username `admin` and email `admin@platform.local`.

## Safety behavior

- No password is committed to the repository or printed in deployment logs.
- Placeholder and short secrets are rejected.
- The bootstrap runs only while no Admin account exists.
- Existing Admin passwords, roles, sessions, and two-factor settings are not modified during later deployments.
- The created account receives the `super_admin` role.
- When no secure password variable exists, the API remains deployable but logs the accepted variable names and does not create a predictable account.

After the first successful login, store the credential in the approved password manager, create named operator accounts, enable two-factor authentication, and retire the bootstrap credential according to the access-control runbook.
