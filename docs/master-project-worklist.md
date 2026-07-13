# Master Project Worklist

เอกสารนี้เป็น source of truth เดียวสำหรับรวม backlog เดิมและแผน refactor โครงสร้างโปรเจกต์

เอกสารที่รวมสถานะ:
- `docs/remaining-work-backlog.md`
- `docs/detailed-remaining-work-backlog.md`
- `docs/code-structure-refactor-plan.md`
- `docs/current-execution-status.md`

วันที่ตรวจ: 2026-07-13

## สถานะ

- ✅ DONE = มี implementation และหลักฐานเพียงพอ
- 🟡 PARTIAL = มีบางส่วน แต่ยังขาด QA/backend/security/production verification
- 🔴 TODO = ยังไม่พบ implementation ที่ยืนยันได้
- ⚠️ CONFLICT = เอกสารบอกว่าทำแล้ว แต่ source ปัจจุบันยังมีปัญหา
- ⏸️ BLOCKED = ต้องรอข้อมูลภายนอก เช่นเอกสาร provider

## สรุปภาพรวม

| กลุ่ม | สถานะจริง |
|---|---|
| Monorepo/API/Admin/Member foundation | ✅ มีแล้ว |
| Admin auth/invitation/role/2FA | 🟡 มีแล้วบางส่วน ต้อง revalidate |
| Finance workflow | ⚠️ มี implementation แต่ source มี blocker |
| Admin operations | 🟡 มี UI แต่ backend/E2E ยังไม่ครบ |
| Member profile/security | 🟡 มี route แล้ว แต่ยังขาด QA |
| Notifications | 🟡 มี list แต่ preference/action ยังไม่ครบ |
| Support/FAQ | 🟡 มี support แต่ FAQ/attachment/realtime ยังไม่ครบ |
| Admin settings/CMS | 🟡 มีหน้า แต่ต้องตรวจ persistence/permission |
| Real provider integration | ⏸️ รอเอกสารค่าย |
| Code structure refactor | 🔴 ยังไม่เริ่มเป็น implementation |
| CI/build reliability | ⚠️ มี foundation แต่ branch ปัจจุบันมี blocker |

---

# P0 — ต้องทำก่อน backlog อื่น

## M-001 Prisma schema

สถานะ: ✅ DONE — Prisma schema, CI migration และ production migration status ผ่านแล้ว

ไฟล์: `prisma/schema.prisma`

- [x] ลบ enum ซ้ำ
- [x] ตรวจ migration และ production schema กับฐานข้อมูลจริงตาม `docs/production-migration-verification-runbook.md`
- [x] รัน `prisma generate` ผ่านใน API build
- [x] ไม่ใช้ script แก้ schema ระหว่าง build

## M-002 Deposit workflow

สถานะ: ✅ DONE — workflow tests, CI migration และ production migration status ผ่านแล้ว

ไฟล์: `apps/api/src/modules/topups/deposit-workflow.service.ts`

- [x] แก้ declaration ซ้ำของ `detectedAmount`
- [x] แก้ declaration ซ้ำของ `transferredAt`
- [x] ตรวจ owner/no-claim/expired-claim/non-owner ผ่าน request owner และ claim checks
- [x] ใช้ row lock และ state-transition guard
- [x] ใช้ idempotency key ตอน credit
- [x] cleanup storage เมื่อ transaction fail
- [x] เพิ่ม static finance workflow safety audit (`pnpm audit:finance-workflows`)
- [x] เพิ่ม static finance workflow safety audit (`pnpm audit:finance-workflows`)
- [x] มี dedicated state-transition/idempotency/concurrency tests ใน `finance-concurrency.db.spec.ts`
- [x] ตรวจ production migration ตาม `docs/production-migration-verification-runbook.md`

## M-003 Withdrawal workflow

สถานะ: ✅ DONE — workflow tests, CI migration และ Railway production migration status ผ่านแล้ว

ไฟล์: `apps/api/src/modules/withdrawals/withdrawal-workflow.service.ts`

- [x] ใช้ status จาก row ที่ lock จริง
- [x] มี `assertClaimOwner()`
- [x] ใช้ row lock และ state-transition guard
- [x] ตรวจ proof upload ซ้ำด้วย hash/transaction reference
- [x] cleanup storage เมื่อ transaction fail/idempotent upload
- [x] ใช้ idempotency key ตอน complete
- [x] มี dedicated state-transition/idempotency/concurrency tests ใน `finance-concurrency.db.spec.ts`
- [x] ตรวจ production migration ตาม `docs/production-migration-verification-runbook.md`

> สถานะ P0: ✅ ปิดครบ — source, CI migration, finance concurrency tests และ Railway production migration status ผ่านแล้ว\n\n## M-004 ลบ build-time source mutation

สถานะ: ✅ DONE — ลบ scripts mutation และ build ใช้ source จริง

ไฟล์เดิม: `tools/fix-api-workflow-sources.mjs`, `tools/fix-prisma-risk-alert-enum.mjs`, `package.json`

- [x] แก้ source/schema จริงก่อน
- [x] เอา `db:fix-schema` ออกจาก `db:generate`
- [x] เอา `fix:api-workflows` ออกจาก `build:api`
- [x] ลบ scripts ที่เขียนทับ source ระหว่าง build
- [x] API CI/build ผ่านโดยไม่พึ่ง source mutation

---

# P1 — Security/เงิน/production

## M-005 Admin owner/account protection

สถานะ: 🟡 PARTIAL — owner protection, status lifecycle, session revoke, login history และ recovery status มีแล้ว; เหลือบังคับ reason ให้ role lifecycle ทุก action และ production verification

- [x] ป้องกัน suspend/downgrade/remove owner คนสุดท้าย (protected owner role/account ถูกบล็อก และ ownership transfer เป็น transaction)
- [x] Ownership transfer flow
- [x] Step-up authentication และ current 2FA confirmation
- [x] Audit ownership transfer
- [x] Owner lockout recovery safeguards/status endpoint (target ต้องเปิด 2FA ก่อน transfer และ owner ตรวจ readiness ได้)
- [x] Admin suspend/lock/unlock สำหรับบัญชี non-protected ผ่าน lifecycle endpoint
- [ ] เหตุผล/หมายเหตุทุก lifecycle action
- [x] Revoke session หลัง suspend/lock ใน transaction เดียวกัน
- [x] Account status timeline (อ่านจาก AdminAuditLog ใน security overview)
- [x] Per-account session management
- [x] Login history ต่อ admin account ใน security overview

## M-006 Permission coverage audit

สถานะ: 🟡 PARTIAL — API controller audit ผ่านครบ และเพิ่ม optional read-only UI smoke แล้ว; ยังรอ credentialed run เพื่อยืนยันผลจริง

- [x] ตรวจทุก admin route/sidebar/widget/export รอบ finance routes; withdrawal workflow ถูกเพิ่ม permission guard
- [ ] ตรวจทุก admin route/sidebar/widget/export ที่เหลือ
- [x] แก้ endpoint การเงินที่ขาด `RequirePermission` (withdrawal workflow)
- [x] ป้องกัน wallet read/adjust endpoints และเพิ่ม `wallet.adjust` ใน seed
- [x] เพิ่ม permission model และ guard ให้ bank accounts (`view/manage/review`)
- [x] เพิ่ม permission model และ guard ให้ Support (`view/reply/manage`)
- [x] ตรวจ endpoint ที่ขาด `RequirePermission` กลุ่มอื่น — audit ล่าสุด 26 controllers: 24 protected, 2 intentionally public, 0 unguarded/auth-only
- [x] เพิ่ม automated route/permission coverage test (`audit:admin-permissions` ใน Quality Gate)
- [ ] ยืนยัน read-only user มองไม่เห็น mutation control

## M-007 Trusted proxy/IP/rate limit

สถานะ: 🟡 PARTIAL — trusted proxy, IP/account rate limit, progressive lockout และ suspicious-device audit มีแล้ว เหลือทดสอบ reverse proxy จริง

- [x] กำหนด trusted proxy ตาม environment ด้วย `TRUSTED_PROXY_HOPS`
- [x] รวม RequestContext เบื้องต้นสำหรับ IP/request ID/user agent
- [x] ป้องกัน spoofed `x-forwarded-for` ใน admin auth โดยใช้ `req.ip` จาก trusted proxy policy
- [ ] ทดสอบ rate limit ผ่าน reverse proxy จริง
- [x] Rate limit คิดทั้ง account และ trusted IP สำหรับ login/register โดย hash account identifier
- [x] Progressive lockout จาก failed login ต่อเนื่อง (Admin 5 ครั้ง / Member 8 ครั้ง ภายใน 15 นาที; ปรับ threshold ผ่าน environment)
- [x] Suspicious login/device history audit จาก IP + User-Agent ที่ไม่เคยพบ

## M-008 Token/session security

สถานะ: 🟡 PARTIAL — HttpOnly refresh cookie และ kill switch สำหรับ legacy fallback มีแล้ว เหลือปิด fallback หลัง grace period

- [x] Refresh rotation/reuse revoke มี implementation บางส่วน
- [x] HttpOnly refresh cookie groundwork ผ่าน admin API และ Next proxy
- [x] Reports/Exports ย้ายมาใช้ shared API client ไม่อ่าน access token โดยตรง
- [x] Login/layout/API client ย้าย access token ไป memory และใช้ refresh cookie หลัง reload
- [x] Legacy refresh token ถูกใช้ migrate ครั้งเดียวแล้วลบหลัง refresh สำเร็จ
- [x] เพิ่ม `NEXT_PUBLIC_ADMIN_LEGACY_REFRESH_FALLBACK=false` เพื่อปิด legacy body/localStorage read หลัง grace period
- [x] HttpOnly/Secure/SameSite cookie
- [x] แยก admin/member cookie
- [x] CSRF origin check ใน Next Admin proxy สำหรับ mutation + `SameSite=Lax` refresh cookie
- [x] เพิ่ม deployed smoke test: cross-origin Admin mutation ถูก block และ login HTML ไม่เปิดเผย access token name
- [x] เพิ่ม optional dynamic login-cookie smoke test (`ADMIN_WEB_URL` + `ADMIN_SMOKE_*`; ข้ามอย่างปลอดภัยเมื่อไม่มี credential)
- [x] ย้าย access token ออกจาก localStorage ใน client/login/layout
- [x] ลบ refresh-token storage หลัง migrate สำเร็จ
- [ ] ลบ refresh-token read fallback หลัง grace period
- [x] XSS/session theft regression boundary (static sink audit + optional login-cookie smoke)
- [x] เพิ่ม static audit ห้ามหน้า Admin อ่าน access token จาก localStorage (`audit:admin-token-storage`)
- [x] เพิ่ม static XSS sink audit ฝั่ง Admin UI (`audit:admin-xss`)
- [x] Admin refresh cookie ใช้ชื่อเฉพาะ `platform_admin_refresh` และไม่ใช้ร่วมกับ Member

## M-009 Anti-bot

สถานะ: 🟡 PARTIAL — core Anti-bot backend ทำแล้ว เหลือ adaptive/emergency behavior และ password-reset route

- [x] Provider selection ครบ (`TURNSTILE`, `RECAPTCHA`, `HCAPTCHA`)
- [x] Encrypted secret storage (`AES-256-GCM`)
- [x] Site key/secret validation ก่อน enable
- [x] Sanitized connection test และไม่คืน secret
- [x] Enable ต่อ route ที่มีอยู่ (`ADMIN_LOGIN`, `MEMBER_LOGIN`, `MEMBER_REGISTER`)
- [ ] เพิ่ม password-reset route และผูก Anti-bot
- [ ] Adaptive challenge/emergency mode ให้มีผลกับ runtime จริง
- [x] Permission view/update/test/override
- [x] Audit log ทุก setting change และ security event

## M-010 Finance/provider verification

สถานะ: 🟡 PARTIAL — transfer/reconciliation/provider safety มี implementation และผ่าน API CI; เหลือ credential lastUsedAt และ test-mode settlement verification

- [x] Game transfer reverse/force-fail/retry state safety (state guard, idempotent reversal, failed-only retry)
- [x] Idempotency key และ WalletLedger ทุก mutation (wallet-synced transfer/reversal ใช้ unique key และ transaction)
- [x] Admin note/AdminAuditLog ทุก action
- [x] Provider preset enabled endpoints/overrides (preset apply ใช้ atomic transaction)
- [ ] Credential create/rotate/mask/disable/lastUsedAt (ยังขาด `lastUsedAt` tracking)
- [x] Health-check response sanitized
- [x] Webhook signature/duplicate/idempotency
- [ ] Test mode ห้าม settle เงินจริง (ต้องเพิ่ม/ยืนยัน explicit test-mode contract)
- [x] Reconciliation relation/note/audit/timeline

---

# P2 — Product backlog ที่มีบางส่วนแล้ว

## M-011 Member home/game discovery

สถานะ: 🟡 PARTIAL — มี home/game/session/filter บางส่วน

- [ ] Featured/recently played
- [ ] Promotion/banner slots
- [ ] Configurable categories/provider filter
- [ ] Game search/favorites
- [ ] Maintenance/disabled states
- [ ] Fallback images/icons
- [ ] Market-style mobile polish รอบสุดท้าย

## M-012 Deposit/withdraw member flow

สถานะ: 🟡 PARTIAL / รอ P0

- [ ] Guided withdrawal steps
- [ ] Review step ก่อน submit
- [ ] Deposit expiration behavior
- [ ] Private slip storage/access control
- [ ] Status cards ให้สม่ำเสมอ
- [ ] Responsive regression/manual money-flow regression

## M-013 Member profile/security

สถานะ: 🟡 PARTIAL — มี route แล้ว แต่ backlog เดิมยังไม่ได้ติ๊ก

มี route: profile, edit, password, security, sessions

- [ ] ตรวจ load/error/retry/empty state
- [ ] Duplicate phone/email
- [ ] Unsaved changes
- [ ] Password strength/mismatch
- [ ] Forced re-login/invalidation
- [ ] Device/IP/last-active/login history
- [ ] Logout all devices/account status
- [ ] Visual/accessibility regression

## M-014 Notifications

สถานะ: 🟡 PARTIAL — มี route/service/controller

- [ ] Group by date/deep link
- [ ] Mark one/all as read backend verification
- [ ] Archive/delete/optimistic rollback
- [ ] Notification preferences route
- [ ] Email/SMS/push และ finance/promotion/security/system toggles
- [ ] Keyboard/screen-reader/zoom QA

## M-015 Support/FAQ

สถานะ: 🟡 PARTIAL — มี member support/admin support center

- [ ] FAQ route/search/category
- [ ] Ticket pagination/search/filter
- [ ] Attachment upload/type/size validation
- [ ] Draft/timeline/preview
- [ ] Close/reopen/polling/realtime
- [ ] Link ticket กับ money/provider

## M-016 Admin settings/CMS

สถานะ: 🟡 PARTIAL — มีหน้า settings หลักแล้ว

- [ ] ตรวจ persistence จริงทุก section
- [ ] Color/contrast/critical toggle validation
- [ ] Legal version/date/preview
- [ ] Campaign CRUD/date/bonus/turnover validation
- [ ] Settings search/unsaved warning/reset defaults
- [ ] Permission guard/audit log
- [ ] ระบุข้อจำกัด binary upload ให้ชัด

## M-017 Reports/activity/risk/security admin

สถานะ: 🟡 PARTIAL — มีหน้าแล้ว แต่ backend/QA ยังไม่ครบ

- [ ] Report aggregate/filter correctness และ CSV
- [ ] Activity pagination/detail/long JSON
- [ ] Risk filters/related links/bulk action
- [ ] Auto-close suggestion
- [ ] Security lifecycle actions
- [ ] Permission coverage ทุก route/widget/export

## M-018 Promotion/bonus และ affiliate/commission

สถานะ: 🟡 PARTIAL / ห้ามเปิดเงินจริง

- [ ] Campaign/bonus lifecycle
- [ ] Turnover tracking QA
- [ ] Member claim/admin review
- [ ] Referral/agent code
- [ ] Commission calculation/settlement
- [ ] Downline/report correctness
- [ ] แยก domain model ออกจาก RiskAlert metadata
- [ ] Audit/concurrency/settlement test ก่อนเปิดเงินจริง

## M-019 CMS/content

สถานะ: 🟡 PARTIAL

- [ ] Mobile banner/announcement/popup QA
- [ ] Maintenance notice
- [ ] Category ordering/featured games
- [ ] Asset/broken URL validation

## M-020 KYC/risk

สถานะ: 🟡 PARTIAL ถึง 🔴 TODO

- [ ] Phone verification
- [ ] Bank verification
- [ ] Duplicate bank detection
- [ ] Risk status lifecycle
- [ ] Blacklist
- [ ] KYC document workflow/retention/access policy

---

# P3 — Provider ที่ติด external dependency

## M-021 Real provider integration

สถานะ: ⏸️ BLOCKED — รอเอกสารค่าย

- [ ] API/UAT/production endpoint
- [ ] API key/secret/merchant/agent ID
- [ ] Signature/error/request-response/webhook specification
- [ ] Game list/catalog/IP whitelist/callback requirements
- [ ] สร้าง adapter และ register provider code
- [ ] Map launch/balance/transfer/game sync/bet history
- [ ] Verify webhook signature
- [ ] Provider-specific tests และ UAT dry-run

---

# P4 — Code structure refactor

สถานะรวม: 🔴 ยังไม่เริ่มเป็น implementation จริง

## R-001 แยก service ใหญ่

ไฟล์เป้าหมาย: game-platform, game-platform-money, money-ops, deposit-workflow, promotions, affiliates

- [ ] แยก query/command
- [ ] แยก mapper/formatter/audit
- [ ] แยก provider orchestration
- [ ] แยก money mutation/reporting
- [ ] เพิ่ม tests ก่อน/หลัง refactor

## R-002 แยก domain/module ทับซ้อน

กลุ่ม: activity/admin-activity/admin-audit, finance/money-ops, risk/risk-alerts, wallet/wallets

- [ ] Endpoint ownership matrix
- [ ] Source of truth
- [ ] รวม query ซ้ำ
- [ ] Backward-compatible route migration
- [ ] Deprecation plan

## R-003 แยก RiskAlert domain

- [ ] AffiliateProfile/AffiliateLink/CommissionLedger
- [ ] PromotionCampaign/PromotionClaim/BonusLedger
- [ ] Relation/index/constraint
- [ ] Migration/backfill
- [ ] ย้าย service/frontend types
- [ ] หยุดใช้ RiskAlert เป็น generic record

## R-004 รวม API client

- [ ] สร้าง `packages/api-client`
- [ ] รวม auth refresh/retry/error/cache
- [ ] ย้ายทุกหน้าใช้ client กลาง
- [ ] ลบ direct `fetch(API_URL)`
- [ ] เพิ่ม client tests

## R-005 ลด any/เพิ่ม DTO

- [ ] DTO สำหรับทุก admin/member body
- [ ] AdminActor/MemberActor
- [ ] ลบ `as any` ที่กลบ enum/status
- [ ] เปิด strict checks เพิ่ม
- [ ] CI ห้าม any เพิ่ม

## R-006 รวม UI/CSS

- [ ] ตรวจ/ลบ `apps/web-admin/app/components/admin-ui.tsx` หากไม่ใช้
- [ ] ตัดสินใจใช้หรือลบ `packages/ui`
- [ ] รวม design tokens/responsive rules
- [ ] ลด CSS mobile/desktop ที่ซ้ำ
- [ ] Visual regression

## R-007 แยก page component ใหญ่

เป้าหมาย: register, deposit-client, withdraw, game-providers, content-center, promotion-center, security

- [ ] แยก hooks/components/validation/formatter
- [ ] เพิ่ม tests

---

# P5 — Performance/storage/CI

## M-022 Query/pagination

สถานะ: 🟡 PARTIAL

- [ ] เปลี่ยน take 200/300/500 เป็น pagination
- [ ] Cursor pagination audit/ledger
- [ ] ใช้ select ลด payload
- [ ] Composite indexes/EXPLAIN ANALYZE
- [ ] ตรวจ N+1/slow query metrics

## M-023 Dashboard read model/cache

- [ ] Dashboard query service
- [ ] Aggregate/summary table ตามเหมาะสม
- [ ] Cache TTL/invalidation

## M-024 Storage security

- [ ] Maximum file size/MIME/content scan
- [ ] Cleanup เมื่อ transaction fail/duplicate
- [ ] Signed URL
- [ ] ลด data URL ขนาดใหญ่

## M-025 Lint/typecheck/tests

- [ ] Lint script ทุก app
- [ ] ESLint config กลาง
- [ ] Formatting/unused vars
- [ ] แยก unit/integration/database/concurrency/e2e/visual
- [ ] State/permission/idempotency/race/API refresh tests

## M-026 CI/config/dependency

มีแล้วตาม checkpoint เดิม:
- [x] CI frozen lockfile
- [x] Prisma validate/generate/build steps

ยังต้องตรวจ:
- [x] ยืนยันกับ branch ล่าสุดผ่าน Quality Gate
- [ ] ยืนยัน PostgreSQL/finance test กับ branch ล่าสุด ไม่ใช่เฉพาะ Build #270
- [x] PostgreSQL service/test database และ finance DB tests รันใน Build workflow
- [ ] ตรวจผลกับ production migration/rollback
- [ ] Fixture builders/isolated cleanup
- [ ] Test artifacts/failure summary
- [ ] Node/pnpm version เดียวกันและแก้ config warning
- [ ] Engines/unused/duplicate/deprecated dependencies
- [ ] แยก env และ startup validation
- [ ] ห้าม default production secret
- [ ] แยก public/server-only env

---

# ลำดับทำงานจริง

## Batch A — source ต้องตรวจผ่าน
- [x] M-001 ถึง M-004
- [x] เลือก branch ล่าสุด
- [x] Prisma validate/generate/typecheck

## Batch B — security/เงิน/production
- [ ] M-005 ถึง M-010
- [ ] Finance concurrency tests
- [ ] Storage security

## Batch C — backlog ที่เป็น partial
- [ ] M-011 ถึง M-020

## Batch D — refactor โครงสร้าง
- [ ] R-001 ถึง R-007

## Batch E — production readiness
- [ ] M-022 ถึง M-026
- [ ] Staging migration/rollback
- [ ] E2E/visual smoke
- [ ] Deployment health/version verification

# Definition of Done

- [x] ไม่มี P0 blocker
- [ ] Prisma validate/generate ผ่านโดยไม่แก้ source
- [ ] Typecheck/lint/build ผ่านทุก package
- [ ] Finance concurrency tests ผ่าน
- [ ] Permission coverage audit ผ่าน
- [ ] ไม่มี duplicate UI/API helper
- [ ] ไม่มี direct API call นอก client กลาง
- [ ] Financial/admin DTO ครบ
- [ ] Query หนักมี pagination/index/limit
- [ ] Session/token policy ผ่าน security review
- [ ] Migration staging/rollback ผ่าน
- [ ] E2E/visual smoke ผ่าน
- [ ] Deployment health/version ตรง commit ล่าสุด

# เอกสารเดิม

เอกสารเดิมเก็บไว้เป็น reference ชั่วคราว ห้ามเพิ่มรายการใหม่โดยไม่เพิ่มใน master ก่อน:
- `docs/remaining-work-backlog.md`
- `docs/detailed-remaining-work-backlog.md`
- `docs/code-structure-refactor-plan.md`

- [ ] เพิ่มลิงก์กลับมาที่ master ในเอกสารเดิม
- [ ] ตรวจ duplicate backlog รอบสุดท้าย
- [ ] Archive เอกสารเดิมหลัง master เสถียร

