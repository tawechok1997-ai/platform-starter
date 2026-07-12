# Code & Project Structure Refactor Plan

> Master status and deduplicated checklist: [docs/master-project-worklist.md](./master-project-worklist.md). Update the master document first; this file is retained as legacy reference.

เอกสารนี้เป็นรายการงานสำหรับปรับโครงสร้างโค้ดของ `platform-starter` ให้เป็นระบบมากขึ้น ดูแลต่อได้ง่าย ลดโค้ดซ้ำ ลด technical debt และเตรียมให้เหมาะกับ production

เอกสารนี้เป็นแผนงาน ไม่ควรแก้ข้ามรายการโดยไม่อัปเดตสถานะและผลตรวจรับ

## สถานะที่ตรวจพบ

- Branch ที่ตรวจ: `feat/admin-cache-invalidation`
- Branch นี้ตามหลัง `origin/main` อยู่ 32 commits ณ วันที่ตรวจ
- Monorepo มี API, web-admin, web-member, packages/ui, Prisma และ test suite
- Prisma schema ปัจจุบันมี enum ซ้ำและ `prisma validate` ไม่ผ่าน
- TypeScript source ปัจจุบันมี compile error ใน workflow ฝากเงิน/ถอนเงิน
- Build มี script ที่แก้ source code และ schema อัตโนมัติก่อน build
- มี component, API client, CSS และเอกสารบางส่วนซ้ำหรือกระจายเกินไป

## กติกาการทำงาน

1. แก้ source จริงก่อน แล้วจึงลบ auto-fix ที่ใช้ปกปิดปัญหา
2. ห้ามลบไฟล์โดยไม่ตรวจ import, route, build และ test ที่อ้างถึง
3. งานที่กระทบเงิน, wallet, withdrawal, topup หรือ permission ต้องมี regression test
4. ทุก migration ต้องตรวจทั้ง `schema.prisma`, migration history และฐานข้อมูล staging
5. ทุกงานต้องผ่าน typecheck, lint, unit test และ build ของ package ที่เกี่ยวข้อง
6. ห้ามรวม refactor ใหญ่กับการเปลี่ยน behavior ทางการเงินใน commit เดียว
7. ก่อน merge ให้ตรวจว่า source tree ไม่มี generated output หรือไฟล์ patch ตกค้าง

---

# P0: Blocker ต้องแก้ก่อน build/deploy

## P0-01 แก้ Prisma enum ซ้ำ

ไฟล์:

- `prisma/schema.prisma`
- `tools/fix-prisma-risk-alert-enum.mjs`
- `package.json`

ปัญหา:

`RiskAlertType` มีค่าเหล่านี้ซ้ำ:

```prisma
DUPLICATE_DEPOSIT_SLIP
REPEATED_DUPLICATE_DEPOSIT_SLIP
```

ทำให้ `prisma validate` ล้มเหลวด้วย P1012

งานที่ต้องทำ:

- [ ] ลบค่า enum ที่ซ้ำใน `prisma/schema.prisma`
- [ ] ตรวจทุก migration ที่สร้างหรือแก้ `RiskAlertType`
- [ ] ตรวจ generated Prisma client หลัง generate
- [ ] รัน `pnpm prisma validate --schema prisma/schema.prisma`
- [ ] ตรวจ `pnpm db:generate`
- [ ] ตรวจ `pnpm db:migrate` บน staging
- [ ] ถ้า schema ใน production diverged ให้ทำ migration ที่ถูกต้องแทนการแก้ด้วย script

เงื่อนไขตรวจรับ:

- Prisma validate ผ่าน
- ไม่มี enum value ซ้ำ
- `db:generate` ไม่แก้ source file ใด ๆ

## P0-02 แก้ workflow ฝากเงินให้ compile ได้โดยไม่พึ่ง script

ไฟล์:

- `apps/api/src/modules/topups/deposit-workflow.service.ts`
- `tools/fix-api-workflow-sources.mjs`

ปัญหา:

- `detectedAmount` ถูกประกาศซ้ำ
- `transferredAt` ถูกประกาศซ้ำ
- มีการเรียก `this.assertClaimOwner(...)` แต่ไม่มี method ใน class

งานที่ต้องทำ:

- [ ] เหลือ declaration ของ `detectedAmount` เพียงจุดเดียว
- [ ] เหลือ declaration ของ `transferredAt` เพียงจุดเดียว
- [ ] ตัดสินใจว่าจะเพิ่ม `assertClaimOwner()` เป็น private method หรือใช้ guard ที่มีอยู่
- [ ] ใช้ helper เดียวกันกับ `approveSlip`, `rejectDeposit`, `confirmCredit`
- [ ] กำหนด behavior เมื่อ claim หมดอายุหรือผู้ตรวจไม่ใช่เจ้าของ claim
- [ ] เพิ่ม unit test สำหรับ owner, non-owner, no claim และ expired claim
- [ ] ลบ logic ที่ script ใช้ลบ declaration หรือ method call ออก

เงื่อนไขตรวจรับ:

- TypeScript ผ่าน
- ทุก workflow ตรวจ claim owner แบบเดียวกัน
- ไม่มี source mutation ระหว่าง build

## P0-03 แก้ workflow ถอนเงินให้ใช้ตัวแปรถูกต้อง

ไฟล์:

- `apps/api/src/modules/withdrawals/withdrawal-workflow.service.ts`
- `tools/fix-api-workflow-sources.mjs`

ปัญหา:

- ใน flow upload payment proof มีการใช้ `request.status` ทั้งที่ตัวแปรที่ query ได้คือ `rows[0]`
- มีการเรียก `assertClaimOwner()` ที่ไม่มี implementation

งานที่ต้องทำ:

- [ ] ใช้ตัวแปร request ที่มี type ชัดเจน
- [ ] แก้ status check ให้ใช้ข้อมูลจาก row ที่ lock ด้วย `FOR UPDATE`
- [ ] เพิ่ม `assertClaimOwner()` หรือ helper กลาง
- [ ] ตรวจ idempotent upload กรณีส่งไฟล์เดิมซ้ำ
- [ ] ตรวจ cleanup storage เมื่อ transaction fail
- [ ] เพิ่ม test state transition ทุกสถานะ
- [ ] ลบ auto-fix ที่แก้ `request.status` เป็น `rows[0].status`

เงื่อนไขตรวจรับ:

- TypeScript ผ่าน
- upload proof ไม่สามารถข้าม state ได้
- retry ซ้ำไม่สร้างข้อมูลซ้ำ

## P0-04 ลบ build-time source mutation

ไฟล์:

- `package.json`
- `tools/fix-api-workflow-sources.mjs`
- `tools/fix-prisma-risk-alert-enum.mjs`

ปัญหา:

คำสั่ง `build:api` เรียก script ที่แก้ไฟล์ TypeScript/Prisma ก่อน build ทำให้ build ไม่ได้ตรวจ source จริง

งานที่ต้องทำ:

- [ ] แก้ source และ schema ให้ถูกต้องถาวร
- [ ] ลบ `pnpm db:fix-schema` ออกจาก `db:generate`
- [ ] ลบ `pnpm fix:api-workflows` ออกจาก `build:api`
- [ ] ย้าย script ที่ยังมีประโยชน์ไปเป็น manual audit tool
- [ ] เปลี่ยนชื่อ `fix-*` เป็น `check-*` หากต้องการใช้ตรวจสอบ
- [ ] ทำ CI ให้ fail ทันทีเมื่อ schema/typecheck ไม่ผ่าน

เงื่อนไขตรวจรับ:

- `build:api` ไม่เขียนไฟล์ source
- git diff หลัง build ต้องว่าง
- build ที่ใช้ source เสียต้อง fail ไม่ใช่ถูก patch ให้ผ่าน

---

# P1: Architecture และความปลอดภัย

## P1-01 จัดการ branch ที่ล้าหลัง

งานที่ต้องทำ:

- [ ] ตรวจความแตกต่างระหว่าง branch ปัจจุบันกับ `origin/main`
- [ ] สำรองงาน local changes ใน `apps/web-admin/app/admin-api.ts` และเอกสารที่แก้ค้างอยู่
- [ ] merge หรือ rebase commits ล่าสุดอย่างระมัดระวัง
- [ ] ตรวจว่า fixes จาก `origin/main` มีผลกับ source ปัจจุบันหรือไม่
- [ ] รัน test หลัง merge ทุกชุด
- [ ] ห้ามทำงานต่อบน branch เก่าหากไม่ได้รับการยืนยันว่าเป็น target branch

เงื่อนไขตรวจรับ:

- มี branch เป้าหมายที่ชัดเจน
- ไม่มี source รุ่นเก่าปนกับ fix รุ่นใหม่
- commit history สามารถอธิบายได้

## P1-02 ปรับ trusted proxy และ client IP

ไฟล์:

- `apps/api/src/main.ts`
- controller ที่อ่าน `req.ip` หรือ `x-forwarded-for`

ปัญหา:

ระบบเชื่อ `x-forwarded-for` จาก request โดยตรง ซึ่งอาจทำให้ผู้โจมตีปลอม IP เพื่อหลบ rate limit หรือทำให้ audit log ผิด

งานที่ต้องทำ:

- [ ] กำหนด trusted proxy ตาม environment
- [ ] ใช้ framework proxy configuration ให้ถูกต้อง
- [ ] สร้าง `RequestContext` กลางสำหรับ IP, request ID และ user agent
- [ ] ไม่ให้ controller แยกอ่าน header เอง
- [ ] test spoofed `x-forwarded-for`
- [ ] ตรวจ rate limit ผ่าน reverse proxy จริงบน staging

## P1-03 ปรับระบบ token ของ admin/member

ไฟล์:

- `apps/web-admin/app/admin-api.ts`
- `apps/web-member/app/member-api.ts`
- auth route และ session provider

ปัญหา:

access token และ refresh token อยู่ใน `localStorage` หากเกิด XSS จะถูกขโมยได้

งานที่ต้องทำ:

- [ ] ออกแบบ HttpOnly, Secure, SameSite cookie สำหรับ session
- [ ] แยก cookie ของ admin และ member
- [ ] ใช้ CSRF protection หากใช้ cookie authentication
- [ ] หมุน refresh token แบบ atomic
- [ ] revoke session เมื่อ reuse token
- [ ] ลบ token ที่อยู่ใน localStorage หลัง migration
- [ ] เพิ่ม XSS/session theft regression test

## P1-04 รวม API client ให้เหลือมาตรฐานเดียว

ไฟล์เป้าหมาย:

- `apps/web-admin/app/admin-api.ts`
- `apps/web-member/app/member-api.ts`
- หน้าเว็บที่เรียก `fetch(API_URL)` โดยตรง

โครงสร้างใหม่ที่แนะนำ:

```text
packages/api-client/
  src/
    base-client.ts
    admin-client.ts
    member-client.ts
    auth-refresh.ts
    errors.ts
    index.ts
```

งานที่ต้องทำ:

- [ ] ย้าย auth header, refresh, retry และ redirect ไปไว้ที่ client กลาง
- [ ] ย้าย error parsing ไปไว้ที่เดียว
- [ ] กำหนด cache policy กลาง
- [ ] ห้ามหน้าเว็บเรียก `API_URL` โดยตรง
- [ ] ห้ามสร้างรูปแบบ response parsing ซ้ำเองในแต่ละหน้า
- [ ] เพิ่ม test สำหรับ 401, refresh fail, 403, network error และ 503

## P1-05 แยก domain model ที่ใช้ RiskAlert ผิดวัตถุประสงค์

ไฟล์:

- `apps/api/src/modules/affiliates/affiliates.service.ts`
- `apps/api/src/modules/promotions/promotions.service.ts`
- `apps/api/src/modules/risk-alerts/risk-alerts.service.ts`
- `prisma/schema.prisma`

ปัญหา:

Affiliate, promotion และ commission ใช้ `RiskAlert`/metadata เป็นที่เก็บข้อมูลหลัก ทำให้ domain ปะปนและ type safety ต่ำ

โครงสร้าง model ที่ควรมี:

```text
AffiliateProfile
AffiliateLink
CommissionLedger
PromotionCampaign
PromotionClaim
BonusLedger
RiskAlert
```

งานที่ต้องทำ:

- [ ] ออกแบบ schema ใหม่โดยแยก entity
- [ ] เพิ่ม foreign key และ unique constraint ที่จำเป็น
- [ ] เพิ่ม index ตาม query จริง
- [ ] สร้าง migration แบบ backward-compatible
- [ ] ทำ data backfill จาก JSON metadata
- [ ] เปลี่ยน service ให้อ่าน model ใหม่
- [ ] ตรวจข้อมูลเก่าก่อนลบ field เดิม
- [ ] ลบการใช้ RiskAlert เป็น generic record หลัง migration เสร็จ

## P1-06 ลด query ขนาดใหญ่และเพิ่ม pagination

ไฟล์ที่ต้องตรวจ:

- `risk.service.ts`
- `risk-alerts.service.ts`
- `bank-accounts.service.ts`
- `admin-audit.service.ts`
- `exports.service.ts`
- `finance.service.ts`
- `money-ops.service.ts`

งานที่ต้องทำ:

- [ ] เปลี่ยน `take: 200/300/500` เป็น pagination
- [ ] ใช้ cursor pagination สำหรับ audit/ledger
- [ ] ใช้ `select` แทน `include` เมื่อไม่จำเป็นต้องได้ทุก field
- [ ] ห้ามดึง wallet ทั้งหมดเพื่อคำนวณ risk หากทำเป็น aggregate/query ได้
- [ ] เพิ่ม index ให้ field ที่ใช้ filter และ order
- [ ] กำหนด maximum page size ที่ server
- [ ] เพิ่ม slow query measurement
- [ ] ทดสอบกับข้อมูลจำลองระดับ production

## P1-07 เพิ่ม DTO และเลิกใช้ `any` ใน financial/admin API

งานที่ต้องทำ:

- [ ] สร้าง DTO สำหรับทุก `@Body()` ที่ยังเป็น `any`
- [ ] สร้าง `AdminActor` type กลาง
- [ ] สร้าง `MemberActor` type กลาง
- [ ] ใช้ Prisma input type เฉพาะจุดอย่างถูกต้อง
- [ ] ลบ `as any` ที่ใช้กลบ enum/status error
- [ ] เปิด `noImplicitAny`, `noUncheckedIndexedAccess` และ strict checks ที่เหมาะสม
- [ ] ตั้ง threshold ห้ามเพิ่มจำนวน `any` ใหม่ใน CI

---

# P2: จัดโครงสร้าง API และ service

## P2-01 แยก service ที่ใหญ่เกินไป

ไฟล์หลัก:

- `game-platform.service.ts`
- `game-platform-money.service.ts`
- `money-ops.service.ts`
- `deposit-workflow.service.ts`
- `promotions.service.ts`
- `affiliates.service.ts`

รูปแบบที่แนะนำ:

```text
module/
  controller.ts
  query.service.ts
  command.service.ts
  workflow.service.ts
  mapper.ts
  policy.ts
  audit.service.ts
  dto/
  types/
```

งานที่ต้องทำ:

- [ ] แยก read query ออกจาก mutation
- [ ] แยก mapper/formatter ออกจาก database service
- [ ] แยก audit logging ออกจาก business transaction เมื่อเหมาะสม
- [ ] แยก provider adapter orchestration ออกจาก game catalog
- [ ] แยก money mutation ออกจาก reporting/dashboard query
- [ ] จำกัด service หนึ่งไฟล์ให้รับผิดชอบ domain เดียว

## P2-02 จัดกลุ่ม module ที่ทับซ้อนกัน

ปัจจุบันมี module ที่หน้าที่ใกล้กัน:

```text
activity
admin-activity
admin-audit
finance
money-ops
risk
risk-alerts
wallet
wallets
```

เป้าหมาย:

```text
audit/
  audit-log
  activity-feed

finance/
  dashboard
  reports

wallets/
  wallet
  ledger

risk/
  detection
  alerts

operations/
  reconciliation
  provider-ops
```

งานที่ต้องทำ:

- [ ] ทำ ownership matrix ของแต่ละ endpoint
- [ ] ระบุ service ที่เป็น source of truth
- [ ] รวม query ที่ซ้ำกัน
- [ ] ย้าย route แบบ backward-compatible
- [ ] เพิ่ม deprecation notice ก่อนลบ endpoint เก่า

## P2-03 จัดมาตรฐานชื่อไฟล์และชื่อ domain

งานที่ต้องทำ:

- [ ] เลือกใช้ `deposits` หรือ `topups` เป็นชื่อหลัก
- [ ] เลือกใช้ `wallet` หรือ `wallets` ตามระดับ module/resource
- [ ] ตั้งชื่อ provider module ให้ตรงกันทั้ง API และ web
- [ ] ใช้ kebab-case สำหรับไฟล์
- [ ] ใช้ชื่อ `*.controller.ts`, `*.service.ts`, `*.module.ts`, `*.policy.ts` ให้สม่ำเสมอ
- [ ] ทำ rename แบบมี import update และ test ทุกครั้ง

---

# P2: Frontend structure

## P2-04 แยก page component ที่ใหญ่

ไฟล์ที่ควรแยกก่อน:

- `apps/web-member/app/(auth)/register/page.tsx`
- `apps/web-member/app/deposit/deposit-client.tsx`
- `apps/web-member/app/withdraw/page.tsx`
- `apps/web-admin/app/(admin)/game-providers/page.tsx`
- `apps/web-admin/app/(admin)/content-center/page.tsx`
- `apps/web-admin/app/(admin)/promotion-center/page.tsx`
- `apps/web-admin/app/(admin)/security/page.tsx`

โครงสร้างต่อหน้า:

```text
feature/
  page.tsx
  components/
    feature-form.tsx
    feature-table.tsx
    feature-dialog.tsx
  hooks/
    use-feature-data.ts
    use-feature-actions.ts
  lib/
    validation.ts
    formatters.ts
  types.ts
```

งานที่ต้องทำ:

- [ ] ย้าย API call ออกจาก JSX/page หลัก
- [ ] ย้าย validation ไปเป็น function/test แยก
- [ ] แยก modal/dialog ที่มี state ของตัวเอง
- [ ] แยก table/list ที่มี render logic ยาว
- [ ] ลด inline style และ inline function ที่ซ้ำ

## P2-05 รวม UI component กลาง

งานที่ต้องทำ:

- [ ] ตรวจการใช้งาน `apps/web-admin/app/components/admin-ui.tsx`
- [ ] ถ้าไม่ใช้ ให้ลบ
- [ ] ย้าย admin component กลางไป `packages/ui` หรือกำหนด local component location เดียว
- [ ] ไม่ให้มี `admin-ui.tsx` สองตำแหน่ง
- [ ] สร้าง component contract และ prop type กลาง
- [ ] เพิ่ม Storybook หรือ visual test สำหรับ component สำคัญถ้าจำเป็น

## P2-06 รวม CSS และ design token

งานที่ต้องทำ:

- [ ] สร้าง design tokens กลางสำหรับ color, spacing, radius, shadow, typography
- [ ] รวม responsive breakpoint ไว้ที่เดียว
- [ ] แยก base, layout, component และ feature styles
- [ ] ลดไฟล์ `*-mobile.css`/`*-desktop.css` ที่ซ้ำ
- [ ] ตรวจ selector ที่ global เกินไป
- [ ] ตรวจ style collision ระหว่าง admin/member
- [ ] เพิ่ม visual regression หลังรวม CSS

โครงสร้างที่แนะนำ:

```text
styles/
  tokens.css
  reset.css
  primitives.css
  layout.css
  components.css
  responsive.css
```

---

# P3: Cleanup และลดความซ้ำซ้อน

## P3-01 ลบ package UI ที่ว่างหรือใช้งานให้จริง

ไฟล์:

- `packages/ui/package.json`
- `packages/ui/src/index.ts`
- `pnpm-lock.yaml`

ทางเลือก:

- [ ] ถ้ายังไม่ใช้: ลบ package และเอาออกจาก lock/workspace
- [ ] ถ้าจะใช้: ย้าย component กลางเข้าไป พร้อมเพิ่ม dependencies, exports และ test

## P3-02 ลบ admin UI component ที่ไม่ได้ใช้

ไฟล์เป้าหมาย:

- `apps/web-admin/app/components/admin-ui.tsx`

ก่อนลบ:

- [ ] `rg` ตรวจ import ทั้ง repository
- [ ] ตรวจ dynamic import
- [ ] รัน web-admin build
- [ ] รัน visual tests

## P3-03 รวมและลด API helper ที่ซ้ำ

ตรวจไฟล์:

- `apps/web-admin/app/admin-api.ts`
- `apps/web-member/app/member-api.ts`
- `apps/web-admin/app/site-settings*`
- `apps/web-member/app/site-settings*`

งานที่ต้องทำ:

- [ ] รวม JSON parsing
- [ ] รวม error class
- [ ] รวม retry policy
- [ ] รวม session redirect
- [ ] รวม URL normalization
- [ ] ลบ helper ที่ไม่ถูก import

## P3-04 จัดเอกสารให้เหลือ source of truth

ไฟล์ที่ควรทบทวน:

- `docs/current-execution-status.md`
- `docs/project-worklist.md`
- `docs/remaining-work-backlog.md`
- `docs/detailed-remaining-work-backlog.md`
- `docs/final-qa-checklist.md`
- `docs/ux-ui-master-roadmap.md`

งานที่ต้องทำ:

- [ ] รวม backlog ซ้ำ
- [ ] แยก architecture, operation, security และ roadmap
- [ ] ใส่ owner/status/date ให้ทุกงาน
- [ ] เพิ่มลิงก์ไป issue/PR แทนการคัดลอกข้อความซ้ำ
- [ ] ทำ archive สำหรับเอกสารเก่า

โครงสร้างเอกสารใหม่:

```text
docs/
  architecture.md
  development.md
  security.md
  operations.md
  deployment.md
  testing.md
  roadmap.md
  refactor-plan.md
  archive/
```

---

# P3: Testing และ CI

## P3-05 เพิ่ม lint ให้ทุก app

ไฟล์:

- `apps/web-admin/package.json`
- `apps/web-member/package.json`
- `apps/api/package.json`
- `package.json`

งานที่ต้องทำ:

- [ ] เพิ่ม lint script ใน web-admin
- [ ] เพิ่ม lint script ใน web-member
- [ ] กำหนด ESLint config กลาง
- [ ] เพิ่ม formatting check
- [ ] เพิ่ม no-unused-vars
- [ ] เพิ่ม no-explicit-any แบบ warning ก่อน แล้วค่อยยกระดับเป็น error
- [ ] ให้ root `pnpm lint` ตรวจครบทุก package

## P3-06 แยกประเภท test ให้ชัด

โครงสร้างที่แนะนำ:

```text
tests/
  unit/
  integration/
  database/
  concurrency/
  e2e/
  visual/
```

งานที่ต้องทำ:

- [ ] ย้าย test ให้ตรงประเภท
- [ ] ไม่ใช้ source string inspection แทน behavior test หากไม่จำเป็น
- [ ] เพิ่ม test สำหรับ state transition
- [ ] เพิ่ม test สำหรับ permission matrix
- [ ] เพิ่ม test สำหรับ idempotency
- [ ] เพิ่ม test สำหรับ database race/concurrency
- [ ] เพิ่ม test สำหรับ API proxy และ token refresh

## P3-07 ทำ CI pipeline ให้ตรวจจริง

Pipeline ขั้นต่ำ:

```text
install --frozen-lockfile
prisma validate
prisma generate
typecheck
lint
unit test
integration test
build api
build web-admin
build web-member
e2e smoke
```

งานที่ต้องทำ:

- [ ] บังคับใช้ pnpm version ตาม `packageManager`
- [ ] ใช้ `pnpm install --frozen-lockfile`
- [ ] ห้าม script แก้ source ระหว่าง CI
- [ ] เก็บ artifact และ test report
- [ ] แยก database test environment จาก production
- [ ] ทำ failure summary ที่อ่านง่าย

---

# P4: Dependency และ configuration

## P4-01 ทำให้ pnpm configuration เป็นมาตรฐานเดียว

ไฟล์:

- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- CI workflow

งานที่ต้องทำ:

- [ ] กำหนด pnpm version เดียวกันใน local/CI/deploy
- [ ] ย้าย config ที่ไม่รองรับไปตำแหน่งที่ถูกต้องของ pnpm version ที่เลือก
- [ ] ตรวจ lockfile ให้สร้างด้วย version เดียวกัน
- [ ] ห้ามมี warning config ใน install/build
- [ ] เพิ่ม `engines` สำหรับ Node.js และ pnpm

## P4-02 ตรวจ dependency ที่ไม่ได้ใช้

งานที่ต้องทำ:

- [ ] ตรวจ dependency ของ root
- [ ] ตรวจ dependency ของทุก app
- [ ] ตรวจ package ที่ import จริงด้วย static analysis
- [ ] ลบ dependency ที่ไม่ใช้
- [ ] ตรวจ duplicate version ใน lockfile
- [ ] ตรวจ deprecated package
- [ ] อัปเดต Next.js/NestJS/Prisma ตาม compatibility plan ไม่อัปเดตแบบสุ่ม

## P4-03 จัด environment configuration

งานที่ต้องทำ:

- [ ] แยก env สำหรับ local, test, staging, production
- [ ] validate env ตอน startup
- [ ] ห้ามใช้ default secret ที่ใช้งาน production ได้
- [ ] แยก public env กับ server-only env
- [ ] ไม่ใช้ `NEXT_PUBLIC_API_URL` สำหรับ secret/config ฝั่ง server
- [ ] เพิ่ม config schema เช่น Zod หรือ Joi
- [ ] ทำเอกสาร env ที่เป็น source of truth เพียงไฟล์เดียว

---

# P5: Data, performance และ operational quality

## P5-01 จัด index และ query plan

งานที่ต้องทำ:

- [ ] ตรวจทุก `where` + `orderBy` ที่ใช้บ่อย
- [ ] เพิ่ม composite index สำหรับ status/date/user
- [ ] ใช้ `EXPLAIN ANALYZE` กับ query dashboard และ risk scan
- [ ] หลีกเลี่ยง N+1 query ใน affiliate/promotions/risk
- [ ] จำกัดข้อมูลที่ส่งกลับหน้าเว็บ
- [ ] เพิ่ม metrics ของ query duration

## P5-02 แยก read model สำหรับ dashboard

ปัญหา:

หลาย dashboard คำนวณข้อมูลจาก transaction tables ทุกครั้ง ทำให้หนักเมื่อข้อมูลโต

งานที่ต้องทำ:

- [ ] แยก dashboard query service
- [ ] ใช้ aggregate query แทนดึงรายการทั้งหมด
- [ ] พิจารณา summary table/materialized view สำหรับสถิติหนัก
- [ ] กำหนด cache TTL ที่เหมาะสม
- [ ] ล้าง cache เมื่อมี mutation สำคัญ

## P5-03 ตรวจ storage workflow

งานที่ต้องทำ:

- [ ] ตรวจ cleanup เมื่อ DB transaction fail
- [ ] ตรวจ cleanup เมื่อ upload ซ้ำ
- [ ] กำหนด maximum file size
- [ ] ตรวจ MIME type จาก content จริง ไม่ใช้ extension อย่างเดียว
- [ ] scan file ที่ upload
- [ ] ไม่ส่ง private media เป็น data URL ขนาดใหญ่โดยไม่จำเป็น
- [ ] ใช้ signed URL แบบหมดอายุสำหรับไฟล์ private

---

# ลำดับการทำงานที่แนะนำ

## Batch 1: ทำให้ระบบตรวจผ่าน

- [ ] P0-01 Prisma enum
- [ ] P0-02 deposit workflow
- [ ] P0-03 withdrawal workflow
- [ ] P0-04 ลบ build auto-fix
- [ ] P1-01 เลือก branch ล่าสุด
- [ ] รัน Prisma validate และ typecheck

## Batch 2: ปิดช่องโหว่และลดความเสี่ยง

- [ ] P1-02 trusted proxy/IP
- [ ] P1-03 token/session
- [ ] P1-04 API client กลาง
- [ ] P1-06 pagination/query limit
- [ ] P1-07 DTO และลด any

## Batch 3: ปรับ domain architecture

- [ ] P1-05 แยก RiskAlert domain
- [ ] P2-01 แยก service ใหญ่
- [ ] P2-02 รวม module ซ้ำ
- [ ] P2-03 naming convention

## Batch 4: ปรับ frontend

- [ ] P2-04 แยก page ใหญ่
- [ ] P2-05 รวม UI component
- [ ] P2-06 รวม CSS/design token
- [ ] P3-02 ลบ component ตกค้าง

## Batch 5: ทำความสะอาดและยกระดับ CI

- [ ] P3-04 รวมเอกสาร
- [ ] P3-05 lint
- [ ] P3-06 test structure
- [ ] P3-07 CI
- [ ] P4 dependency/config
- [ ] P5 performance/storage

---

# Definition of Done

ถือว่างาน refactor ชุดนี้เสร็จเมื่อ:

- [ ] `prisma validate` ผ่าน
- [ ] `prisma generate` ไม่แก้ source file
- [ ] `pnpm typecheck` ผ่านทุก app
- [ ] `pnpm lint` ตรวจครบทุก package
- [ ] unit/integration/concurrency tests ผ่าน
- [ ] API, web-admin และ web-member build ผ่าน
- [ ] ไม่มี `fix-*` script ที่ถูกเรียกก่อน build
- [ ] ไม่มี duplicate UI component ที่ไม่ได้ใช้
- [ ] ไม่มีหน้าเว็บเรียก API โดยตรงนอก API client กลาง
- [ ] financial workflow มี DTO และ type ครบ
- [ ] query หนักมี pagination/index/limit
- [ ] session/token policy ผ่าน security review
- [ ] migration ผ่านบน staging และ rollback plan พร้อม
- [ ] เอกสาร architecture และ deployment อัปเดตตรงกับโค้ด
- [ ] git diff หลัง build ว่าง
