# Activity Projection Ownership

## Decision

`admin-activity` is the first-class owner of the cross-domain administrative timeline exposed at `GET /admin/activity/timeline`.

The legacy `activity` module remains a compatibility surface for `GET /admin/operations/history`. That endpoint is intentionally narrower: it reads only `AdminAuditLog`, supports module/action/admin filters and returns the existing compact response shape.

## Why the modules are not merged blindly

The two routes have different permissions, filters, source tables and response contracts:

- `/admin/operations/history` requires `admin.view` and reads only admin audit records.
- `/admin/activity/timeline` requires `admin.activity.view` and combines audit, ledger, top-up and withdrawal projections.

Treating these as duplicates would change authorization and response behavior. The safe direction is to keep the compatibility route while preventing new projection logic from being added to the legacy module.

## Ownership rules

1. New cross-domain activity sources and timeline filters belong in `admin-activity`.
2. `activity` may contain only the compatibility controller, its compact audit query and response mapping.
3. No finance mutation may be introduced into either module.
4. Both modules use the shared `JwtAuthModule`; feature-level JWT registration is forbidden.
5. Removing `/admin/operations/history` requires a consumer inventory and a versioned deprecation window.

## Closure path for DEDUP-04

- inventory frontend and external consumers of `/admin/operations/history`;
- add a compatibility adapter in `admin-activity` that preserves the exact compact response;
- move the compact query implementation and mapper under `admin-activity`;
- retain the legacy controller as a thin adapter for one release cycle;
- remove the legacy module only after smoke tests confirm no remaining consumers.
