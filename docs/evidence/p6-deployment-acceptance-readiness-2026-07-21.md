# P6 Deployment and Acceptance Readiness

วันที่ตรวจ: 2026-07-21

## Deployment status

Approved commit: `b5d13bf4fd3a792f5a815e3ab9ff126a12bd99aa`

Railway deployment checks ผ่านครบ:

- `@platform/api`
- `@platform/web-admin`
- `@platform/web-member`

## Deployed URLs

- Admin: `https://platformweb-admin-production.up.railway.app`
- Member: `https://platformweb-member-production.up.railway.app`
- API: `https://platformapi-production-3c91.up.railway.app`

## Authenticated Admin acceptance workflow

Workflow `.github/workflows/admin-deployment-browser-qa.yml` รองรับโหมด authenticated acceptance แล้ว โดยใช้ input `require_authentication=true` และตรวจว่า secrets ถูกตั้งเป็นคู่ก่อนเริ่มทดสอบ

Required GitHub Actions secrets:

- `ADMIN_TEST_USERNAME`
- `ADMIN_TEST_PASSWORD`

เมื่อ authenticated acceptance ผ่าน workflow จะสร้างหลักฐานดังนี้:

- full-page screenshots
- Playwright HTML report
- JSON acceptance manifest
- traces
- failure videos
- Axe accessibility violation attachments เมื่อพบปัญหา

## Current blocker

ยังไม่สามารถปิด authenticated P6 checkboxes ได้จนกว่าจะตั้ง seeded non-production credentials และรัน workflow ในโหมด `require_authentication=true` สำเร็จ

## Next execution

1. ตั้ง `ADMIN_TEST_USERNAME` และ `ADMIN_TEST_PASSWORD` ใน repository secrets
2. รัน workflow `Admin Deployment Browser QA` แบบ manual
3. ตั้ง `require_authentication=true`
4. ตรวจ artifact และ acceptance manifest
5. ใช้ผลเดียวกันปิด authenticated browser matrix, mobile real-data interaction verification และ deployment visual evidence review เมื่อหลักฐานครบ
