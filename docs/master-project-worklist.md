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

หลักฐานล่าสุด 2026-07-13:
- ลบ legacy direct-complete endpoint `POST admin/withdrawals/:id/complete` ออกจาก controller แล้ว ให้ใช้ workflow endpoint `verify-payment` แทน
- `pnpm --filter @platform/api test -- src/modules/finance/finance-workflow-integrity.spec.ts --runInBand` ผ่านในชุด targeted regression

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

สถานะ: 🟡 PARTIAL — owner protection, status lifecycle, ownership transfer, session revoke, login history และ recovery status มีแล้ว; เหลือ production verification

หลักฐานล่าสุด 2026-07-13:
- `pnpm build:api` ผ่านในรอบตรวจ P1 ล่าสุด จึงยืนยัน compile path ของ API ได้
- `pnpm --filter @platform/api test -- --runInBand` ผ่าน: 25 suites passed, 2 skipped, 107 tests passed, 7 skipped
- Production verification ยังทำไม่ได้จาก environment นี้ เพราะไม่มี credentialed admin session และ Railway API smoke ถูก local proxy บล็อกด้วย `CONNECT tunnel failed, response 403`

- [x] ป้องกัน suspend/downgrade/remove owner คนสุดท้าย (protected owner role/account ถูกบล็อก และ ownership transfer เป็น transaction)
- [x] Ownership transfer flow
- [x] Step-up authentication และ current 2FA confirmation
- [x] Audit ownership transfer
- [x] Owner lockout recovery safeguards/status endpoint (target ต้องเปิด 2FA ก่อน transfer และ owner ตรวจ readiness ได้)
- [x] Admin suspend/lock/unlock สำหรับบัญชี non-protected ผ่าน lifecycle endpoint
- [x] เหตุผล/หมายเหตุทุก lifecycle action (status/role/delegation/session/ownership transfer บังคับ reason และ audit)
- [x] Revoke session หลัง suspend/lock ใน transaction เดียวกัน
- [x] Account status timeline (อ่านจาก AdminAuditLog ใน security overview)
- [x] Per-account session management
- [x] Login history ต่อ admin account ใน security overview

## M-006 Permission coverage audit

สถานะ: 🟡 PARTIAL — API controller audit ผ่านครบ และเพิ่ม optional read-only UI smoke แล้ว; ยังรอ credentialed run เพื่อยืนยันผลจริง

หลักฐานล่าสุด 2026-07-13:
- `pnpm audit:admin-permissions` ผ่าน: 26 controllers, 24 protected with permission metadata, 2 intentionally public, 0 auth-only/manual-review, 0 unguarded
- `pnpm audit:admin-ui-permissions` ผ่าน: ตรวจ 67 admin page routes, protected/allowlisted 67, unprotected 0 และ sidebar item ที่ไม่มี permission metadata นอก allowlist 0
- เพิ่ม route-permission fallback สำหรับหน้า admin ที่ไม่ได้อยู่ใน sidebar เช่น `/access`, `/activity`, `/exports`, `/finance`, `/ledgers`, `/member-detail`, `/money-ops`, `/provider-adapters`, `/provider-wallet-snapshots`, `/webhook-settlement`, `/webhook-test` และเพิ่ม permission metadata ให้ `/content-center`
- `pnpm build:web-admin` ผ่านหลังแก้ route/sidebar permission coverage
- `pnpm build:api` ผ่าน: Prisma generate และ Nest API build สำเร็จ
- `API_URL=https://platformapi-production-3c91.up.railway.app bash scripts/smoke-api.sh` ยังรัน production smoke ไม่สำเร็จจาก environment นี้ เพราะทุก curl ถูก local proxy บล็อกด้วย `CONNECT tunnel failed, response 403`
- ยังยืนยัน read-only user ด้วย credentialed browser smoke ไม่ได้ใน environment นี้ เพราะไม่มี read-only admin credentials และ production smoke ถูก local proxy บล็อก จึงคง checklist นี้เป็น pending/blocker ไม่ติ๊กหลอก

- [x] ตรวจทุก admin route/sidebar/widget/export รอบ finance routes; withdrawal workflow ถูกเพิ่ม permission guard
- [x] ตรวจทุก admin route/sidebar/widget/export ที่เหลือ
- [x] แก้ endpoint การเงินที่ขาด `RequirePermission` (withdrawal workflow)
- [x] ป้องกัน wallet read/adjust endpoints และเพิ่ม `wallet.adjust` ใน seed
- [x] เพิ่ม permission model และ guard ให้ bank accounts (`view/manage/review`)
- [x] เพิ่ม permission model และ guard ให้ Support (`view/reply/manage`)
- [x] ตรวจ endpoint ที่ขาด `RequirePermission` กลุ่มอื่น — audit ล่าสุด 26 controllers: 24 protected, 2 intentionally public, 0 unguarded/auth-only
- [x] เพิ่ม automated route/permission coverage test (`audit:admin-permissions` ใน Quality Gate)
- [ ] ยืนยัน read-only user มองไม่เห็น mutation control

## M-007 Trusted proxy/IP/rate limit

สถานะ: 🟡 PARTIAL — trusted proxy, IP/account rate limit, progressive lockout และ suspicious-device audit มีแล้ว เหลือทดสอบ reverse proxy จริง

หลักฐานล่าสุด 2026-07-13:
- ตรวจ source แล้วพบ `TRUSTED_PROXY_HOPS`, Express `trust proxy`, rate-limit key แยก IP/account และ log IP จาก `req.ip` ใน `apps/api/src/main.ts`
- `pnpm --filter @platform/api test -- src/modules/auth/auth.service.spec.ts --runInBand` ผ่าน: 1 suite, 5 tests
- `pnpm --filter @platform/api test -- --runInBand` ผ่านหลังแก้ Jest config: 25 suites passed, 2 skipped, 107 tests passed, 7 skipped
- Reverse-proxy/API smoke กับ Railway ยังถูก local proxy บล็อกด้วย `CONNECT tunnel failed, response 403` จึงยังยืนยันผ่าน proxy จริงไม่ได้ และคง checklist reverse proxy จริงเป็น pending/blocker

- [x] กำหนด trusted proxy ตาม environment ด้วย `TRUSTED_PROXY_HOPS`
- [x] รวม RequestContext เบื้องต้นสำหรับ IP/request ID/user agent
- [x] ป้องกัน spoofed `x-forwarded-for` ใน admin auth โดยใช้ `req.ip` จาก trusted proxy policy
- [ ] ทดสอบ rate limit ผ่าน reverse proxy จริง
- [x] Rate limit คิดทั้ง account และ trusted IP สำหรับ login/register โดย hash account identifier
- [x] Progressive lockout จาก failed login ต่อเนื่อง (Admin 5 ครั้ง / Member 8 ครั้ง ภายใน 15 นาที; ปรับ threshold ผ่าน environment)
- [x] Suspicious login/device history audit จาก IP + User-Agent ที่ไม่เคยพบ

## M-008 Token/session security

สถานะ: 🟡 PARTIAL — HttpOnly refresh cookie ใช้งานแล้ว และลบ legacy fallback ออกจาก Admin API แล้ว; เหลือ production verification

หลักฐานล่าสุด 2026-07-13:
- `pnpm audit:admin-token-storage` ผ่าน: ไม่พบ direct admin access token storage นอก `admin-api.ts`
- `pnpm audit:admin-xss` ผ่าน: ไม่พบ unsafe Admin UI HTML sinks
- `pnpm build:web-admin` ผ่าน: Next Admin build/typecheck สำเร็จ
- Production/login-cookie smoke ยังทำไม่ได้จาก environment นี้ เพราะ browser-backed smoke ต้องใช้ Playwright browser และ/หรือ credentialed deployed web URL

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
- [x] ลบ refresh-token read fallback หลัง grace period
- [x] XSS/session theft regression boundary (static sink audit + optional login-cookie smoke)
- [x] เพิ่ม static audit ห้ามหน้า Admin อ่าน access token จาก localStorage (`audit:admin-token-storage`)
- [x] เพิ่ม static XSS sink audit ฝั่ง Admin UI (`audit:admin-xss`)
- [x] Admin refresh cookie ใช้ชื่อเฉพาะ `platform_admin_refresh` และไม่ใช้ร่วมกับ Member

## M-009 Anti-bot

สถานะ: 🟡 PARTIAL — core Anti-bot backend, password-reset flow และ adaptive/emergency runtime ทำแล้ว เหลือ production verification

หลักฐานล่าสุด 2026-07-13:
- ตรวจ source พบ provider `TURNSTILE`/`RECAPTCHA`/`HCAPTCHA`, endpoint admin/public anti-bot, login/register/password-reset integration และ secret encryption ใน `apps/api/src/modules/anti-bot`
- `pnpm build:api` ผ่านแล้วในรอบตรวจ P1 ล่าสุด
- `pnpm --filter @platform/api test -- src/modules/anti-bot/anti-bot.service.spec.ts --runInBand` ผ่านหลังแก้ Jest config เป็น CommonJS และอัปเดต test route fixture: 1 suite, 6 tests
- `pnpm --filter @platform/api test -- --runInBand` ผ่าน: 25 suites passed, 2 skipped, 107 tests passed, 7 skipped
- Production provider/runtime verification ยังทำไม่ได้จาก environment นี้ เพราะ Railway API smoke ถูก local proxy บล็อกด้วย `CONNECT tunnel failed, response 403`

- [x] Provider selection ครบ (`TURNSTILE`, `RECAPTCHA`, `HCAPTCHA`)
- [x] Encrypted secret storage (`AES-256-GCM`)
- [x] Site key/secret validation ก่อน enable
- [x] Sanitized connection test และไม่คืน secret
- [x] Enable ต่อ route ที่มีอยู่ (`ADMIN_LOGIN`, `MEMBER_LOGIN`, `MEMBER_REGISTER`)
- [x] เพิ่ม password-reset route และผูก Anti-bot (one-time hashed token, revoke member sessions หลัง reset)
- [x] Adaptive challenge ให้มีผลกับ runtime จริง (บังคับหลัง failed login จาก IP เดิมอย่างน้อย 3 ครั้ง/15 นาที)
- [x] Emergency mode บังคับ challenge ทุก auth route เมื่อ runtime เปิด
- [x] Permission view/update/test/override
- [x] Audit log ทุก setting change และ security event

## M-010 Finance/provider verification

สถานะ: 🟡 PARTIAL — transfer/reconciliation/provider safety, credential usage tracking และ test-mode guard มี implementation; เหลือ production migration verification

หลักฐานล่าสุด 2026-07-13:
- `pnpm audit:finance-workflows` ผ่านครบ 8 checks: deposit/withdraw row lock, claim owner guard, credit/completion idempotency และ storage cleanup
- `pnpm build:api` ผ่าน: Prisma generate และ Nest API build สำเร็จ
- `pnpm --filter @platform/api test:db:finance -- --runInBand` รันได้แล้วแต่ skip อย่างปลอดภัย: 1 suite skipped, 6 tests skipped เพราะ environment นี้ไม่มี database test configuration
- `pnpm --filter @platform/api test -- --runInBand` ผ่านหลังลบ legacy direct-complete endpoint: 25 suites passed, 2 skipped, 107 tests passed, 7 skipped
- Production migration/provider verification ยังทำไม่ได้จาก environment นี้ เพราะ Railway API smoke ถูก local proxy บล็อกด้วย `CONNECT tunnel failed, response 403`

- [x] Game transfer reverse/force-fail/retry state safety (state guard, idempotent reversal, failed-only retry)
- [x] Idempotency key และ WalletLedger ทุก mutation (wallet-synced transfer/reversal ใช้ unique key และ transaction)
- [x] Admin note/AdminAuditLog ทุก action
- [x] Provider preset enabled endpoints/overrides (preset apply ใช้ atomic transaction)
- [x] Credential create/rotate/mask/disable/lastUsedAt (มี field/migration และอัปเดตเมื่อเรียก provider)
- [x] Health-check response sanitized
- [x] Webhook signature/duplicate/idempotency
- [x] Test mode ห้าม settle เงินจริง (adapter transfer tests จำกัด demo/simulator และ block real provider)
- [x] Reconciliation relation/note/audit/timeline

---

# P2 — Product backlog ที่มีบางส่วนแล้ว

## M-011 Member home/game discovery

สถานะ: ✅ DONE — home/game/session/filter หลักครบตาม checklist M-011

หลักฐานล่าสุด 2026-07-13:
- ตรวจเทียบ M-011 กับ UI จริงแล้วพบว่า reference/market theme ซ่อน tabs/toolbar ด้วย `display: none !important` ทำให้ checklist filter/search ไม่เป็นจริง จึงแก้ให้ tabs/search/provider filter แสดงใช้งานได้ใน theme ปัจจุบัน
- เพิ่ม rail `เล่นล่าสุด` จาก local recent game history และแก้ rail เกมโปรดให้ label ตรงกับ favorite list
- เพิ่มปุ่ม launch บนครอบรูปเกมเพื่อให้เปิดเกมได้แม้ market theme ซ่อน card body/ปุ่มเล่นแบบเดิม และยัง disable เมื่อเกมหรือค่ายอยู่สถานะไม่พร้อม
- เปิด maintenance/disabled badge ใน market lobby theme เพื่อไม่ซ่อนสถานะเกม/ค่ายที่ไม่พร้อม
- `pnpm build:web-member` ผ่าน
- เพิ่ม `PromotionSlotGrid` จาก CMS banners เป็น slot โปรโมชั่น 3 ช่องใต้ hero โดยซ่อนเมื่อไม่มี banner ที่เปิดใช้งาน
- เพิ่ม mobile polish รอบสุดท้ายให้ game lobby/promo slots: controls ไม่ถูกซ่อน, tabs scroll ได้, touch targets ชัดขึ้น และ padding รองรับ bottom nav/safe-area

- [x] Featured/recently played
- [x] Promotion/banner slots
- [x] Configurable categories/provider filter
- [x] Game search/favorites
- [x] Maintenance/disabled states
- [x] Fallback images/icons
- [x] Market-style mobile polish รอบสุดท้าย

## M-012 Deposit/withdraw member flow

สถานะ: 🟡 PARTIAL — มี step indicator และ review/confirm ก่อนส่งรายการแล้ว; ยังเหลือ expiry/storage/status/responsive regression

หลักฐานล่าสุด 2026-07-13:
- ตรวจ source พบ withdraw flow มี `FinanceStepIndicator` สำหรับขั้นตอนบัญชี → จำนวนเงิน → ยืนยัน → รอดำเนินการ และมี validation ก่อนเปลี่ยน step
- Deposit/withdraw ใช้ `FinanceConfirmDialog` เพื่อตรวจทานข้อมูลก่อน submit จริง (`submit`) ทั้งรายการฝากและถอน
- `pnpm build:web-member` ผ่านหลังตรวจ M-012 รอบนี้
- เพิ่ม deposit transfer countdown 15 นาทีในหน้าแนบสลิป และ block submit เมื่อหมดเวลาเพื่อให้สมาชิกเริ่มรายการใหม่ก่อนส่งหลักฐาน
- ปิดการคืน private slip storage key/file hash จาก `submitEvidence` ให้ member response และเพิ่ม unit test ยืนยันว่า member ไม่เห็น `slips/`/`fileHash`; admin slip access ยังผ่าน endpoint ที่มี `finance.topups.view`
- ปรับ `FinanceStatusBadge` ให้ใช้ label/tone ที่ครอบคลุม deposit/withdraw workflow statuses เช่น `PENDING_SLIP_REVIEW`, `PENDING_CREDIT`, `APPROVED_FOR_PAYMENT`, `PAYMENT_PROOF_UPLOADED`, `PAYMENT_VERIFIED`, `DUPLICATE`, `CANCELLED`

- [x] Guided withdrawal steps
- [x] Review step ก่อน submit
- [x] Deposit expiration behavior
- [x] Private slip storage/access control
- [x] Status cards ให้สม่ำเสมอ
- [ ] Responsive regression/manual money-flow regression

## M-013 Member profile/security

สถานะ: 🟡 PARTIAL — มี route แล้ว แต่ backlog เดิมยังไม่ได้ติ๊ก

มี route: profile, edit, password, security, sessions

หลักฐานล่าสุด 2026-07-13:
- เพิ่ม retry action และ empty state ให้หน้า `/profile` เมื่อโหลด profile/wallet ไม่สำเร็จ
- เพิ่ม retry action, header refresh และ empty state ให้หน้า `/profile/security` เมื่อโหลด security overview ไม่สำเร็จ
- `pnpm build:web-member` ผ่าน
- เพิ่ม backend duplicate phone/email conflict แยกข้อความเฉพาะฟิลด์และ normalize email ก่อน update profile พร้อม unit test `auth.service.spec.ts`
- `pnpm --filter @platform/api test -- src/modules/auth/auth.service.spec.ts --runInBand` ผ่าน และ `pnpm build:api` ผ่าน
- หน้า `/profile/edit` มี `beforeunload` guard อยู่แล้ว และเพิ่ม visible warning เมื่อ draft ไม่ตรงกับ saved state เพื่อกันผู้ใช้ลืมบันทึก
- หน้า `/profile/password` มี strength meter 5 เงื่อนไข, submit ต้องผ่าน score ขั้นต่ำ และแสดง `role=alert` เมื่อยืนยันรหัสผ่านไม่ตรงกัน
- ตรวจ source พบ password change เรียก `authSession.updateMany` revoke session อื่นทั้งหมด และ password reset revoke member sessions ทั้งหมดหลัง reset
- `/profile/security` แสดง active sessions, failed login count, recent login history พร้อม IP/User-Agent/reason จาก `getMemberSecurity`; `/profile/sessions` แสดง device/IP/created/expires และมี revoke ราย session
- `/profile/sessions` มีปุ่มออกจากอุปกรณ์อื่น (`DELETE /member/auth/sessions/others`) พร้อม confirm และแสดงจำนวน session ที่ revoke
- Visual/accessibility regression แบบ browser-backed ยังไม่ติ๊ก เพราะ environment นี้ไม่มี authenticated member credentials และ Playwright/browser smoke ยังไม่พร้อมสำหรับ regression จริง
- `pnpm build:web-member` ผ่านหลังเพิ่ม unsaved warning/ตรวจ password/session/security behavior

- [x] ตรวจ load/error/retry/empty state
- [x] Duplicate phone/email
- [x] Unsaved changes
- [x] Password strength/mismatch
- [x] Forced re-login/invalidation
- [x] Device/IP/last-active/login history
- [x] Logout all devices/account status
- [ ] Visual/accessibility regression

## M-014 Notifications

สถานะ: 🟡 PARTIAL — มี route/service/controller และเพิ่ม persistence สำหรับ read/archive/preferences

หลักฐานล่าสุด 2026-07-13:
- ตรวจ `NotificationPreference` แล้วพบ persistence มีเฉพาะ finance/security/promotion/system booleans ยังไม่มี email/SMS/push channel fields จึงยังไม่ติ๊กข้อ channel toggles เพื่อไม่ให้ list เกินจริง
- เพิ่ม notification accessibility pass: loading/message ใช้ status live region, notification cards มี `aria-labelledby`, action group/ปุ่มมี aria-label เฉพาะรายการ, focus-visible style และ mobile/zoom action layout
- `pnpm build:web-member` ผ่าน

- [x] Group by date/deep link (API คืน `groups` ตามวันและ `href` สำหรับ deep link)
- [x] Mark one/all as read backend verification
- [x] Archive backend state (delete/optimistic rollback ฝั่ง UI ยังเหลือ)
- [x] Notification preferences route
- [ ] Email/SMS/push และ finance/promotion/security/system toggles
- [x] Keyboard/screen-reader/zoom QA

## M-015 Support/FAQ

สถานะ: 🟡 PARTIAL — มี member support/admin support center

หลักฐานล่าสุด 2026-07-13:
- เพิ่ม FAQ category filter บน `/support` ร่วมกับ search เดิม (`all/deposit/withdraw/game/account/general`) และ focus-visible style สำหรับ keyboard
- Attachment upload ยังไม่ติ๊ก: support ticket backend ตอนนี้เก็บใน `RiskAlert.metadata.messages` และยังไม่มี storage/attachment model แยกสำหรับไฟล์แนบพร้อม type/size policy
- เพิ่ม local draft persistence สำหรับคำร้องใหม่, preview ก่อนส่ง และ aria-label ให้ timeline/thread ของ ticket
- เพิ่มการรับ query string `refType`/`refId` บน `/support` เพื่อ prefill reference จาก money/provider flow, แสดง reference ใน notice/preview และส่งต่อไปยัง `POST /member/support-tickets`
- เพิ่ม polling fallback ทุก 60 วินาทีในหน้าประวัติคำร้อง และยืนยัน backend รองรับการตอบกลับคำร้องที่ปิดแล้วให้ reopen เป็น `REVIEWING`
- `pnpm build:web-member` ผ่าน

- [x] FAQ route/search/category
- [x] Ticket pagination/search/filter (cursor pagination, status/category/search filters)
- [ ] Attachment upload/type/size validation
- [x] Draft/timeline/preview
- [x] Close/reopen/polling/realtime (ใช้ polling fallback; ไม่มี WebSocket realtime)
- [x] Link ticket กับ money/provider

## M-016 Admin settings/CMS

สถานะ: 🟡 PARTIAL — มีหน้า settings หลักแล้ว

หลักฐานล่าสุด 2026-07-13:
- เพิ่ม dirty-state detection ให้ settings section page, แสดง warning เมื่อมีค่าที่ยังไม่บันทึก, กัน accidental navigation ด้วย `beforeunload`, และเพิ่มปุ่ม Reset เพื่อย้อนกลับค่าล่าสุดที่โหลดจาก API
- ตรวจ Content Center แล้วพบว่า asset library เป็นแบบ URL-backed เท่านั้น, หน้า CMS ระบุว่ายังไม่เปิด binary upload และ validate URL `http/https` สำหรับรูป/วิดีโอ
- เพิ่ม legal settings fields สำหรับ version/effective date และ legal preview ที่สรุป terms/privacy/cookie ก่อนบันทึก
- เพิ่ม WCAG contrast warning ใน Branding preview สำหรับ text/background, text/card และ primary button contrast พร้อมเลือกสีตัวอักษรบนปุ่มให้อ่านง่าย
- ตรวจ API settings แล้วทุก section (`website/branding/theme/seo/contact/maintenance/scripts/features/legal`) มี route เฉพาะที่ครอบด้วย `AdminAuthGuard`, `PermissionsGuard`, `RequirePermission` แยก view/update และ `updateAdminGroup` บันทึกทั้ง `siteSettingHistory` + `adminAuditLog`
- ตรวจ persistence แล้วทุก section update ผ่าน `siteSetting.upsert` ใน `SettingsService.updateAdminGroup` และส่ง `updatedBy`/type/public/sensitive flags ครบ
- เพิ่ม validation ให้ Promotion Center: disable save เมื่อมี warnings, ใช้ date input สำหรับ starts/ends, ตรวจ duplicate id, required title/detail เมื่อเปิดใช้งาน, bonus percent <= 100, ตัวเลขไม่ติดลบ, turnover > 0, และ startsAt <= endsAt
- `pnpm build:web-admin` ผ่าน

- [x] ตรวจ persistence จริงทุก section
- [x] Color/contrast/critical toggle validation
- [x] Legal version/date/preview
- [x] Campaign CRUD/date/bonus/turnover validation
- [x] Settings search/unsaved warning/reset defaults
- [x] Permission guard/audit log
- [x] ระบุข้อจำกัด binary upload ให้ชัด

## M-017 Reports/activity/risk/security admin

สถานะ: 🟡 PARTIAL — มีหน้าแล้ว แต่ backend/QA ยังไม่ครบ

หลักฐานล่าสุด 2026-07-13:
- เพิ่ม expandable `Detail JSON` ใน Activity Timeline เพื่อดู payload เต็มของแต่ละ event โดยจำกัดความสูง/scroll สำหรับ long JSON และยังคง pagination/filter เดิม
- `pnpm build:web-admin` ผ่าน

- [ ] Report aggregate/filter correctness และ CSV
- [x] Activity pagination/detail/long JSON
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
