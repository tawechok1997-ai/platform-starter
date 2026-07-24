# P6 Deployed Environment Endpoints

วันที่บันทึก: 2026-07-25

## Endpoints ที่จัดเตรียมแล้ว

- Admin: `https://platformweb-admin-production.up.railway.app/`
- Admin login: `https://platformweb-admin-production.up.railway.app/login?next=/dashboard`
- Member: `https://platformweb-member-production.up.railway.app/`
- API: `https://platformapi-production-3c91.up.railway.app/`

## Deployment evidence

- Repository: `tawechok1997-ai/platform-starter`
- Branch: `main`
- Latest verified commit at the time of this evidence: `fdf16111d6814f47865cdb5fa12d6d8c86f23d37`
- Railway deployment checks reported success for:
  - `@platform/api`
  - `@platform/web-admin`
  - `@platform/web-member`

## Scope and limitations

This evidence closes only the P6 task for preparing deployed Admin and Member URLs.

It does not close authenticated browser regression, production account verification, cookie/session regression, provider UAT, or production workload verification. Those tasks still require valid seeded credentials, environment access, or vendor-specific information.
