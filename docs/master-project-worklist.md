# Master Project Worklist

เอกสารนี้เป็น **source of truth หลักเพียงไฟล์เดียว** สำหรับสถานะงานทั้งโปรเจกต์ โดยรวม backlog เดิม งาน production readiness งาน UX/UI และแผน refactor โครงสร้าง

เอกสารอ้างอิงเดิม:
- `docs/remaining-work-backlog.md`
- `docs/detailed-remaining-work-backlog.md`
- `docs/code-structure-refactor-plan.md`
- `docs/current-execution-status.md`
- `docs/master-worklist.md`

วันที่ตรวจล่าสุด: **2026-07-14**  
Branch อ้างอิง: **`main`**

## สถานะ

- ✅ DONE — implementation และหลักฐานเพียงพอ
- 🟡 PARTIAL — implementation มีแล้ว แต่ยังขาด QA, production verification หรือส่วนประกอบบางรายการ
- 🔴 TODO — ยังไม่มี implementation ที่ยืนยันได้
- ⚠️ CONFLICT — เอกสารกับ source หรือ checklist ไม่ตรงกัน
- ⏸️ BLOCKED — รอ credential, provider document, deployed URL หรือ external decision

## กติกาการอัปเดต

1. ทำงานตามลำดับ P0 → P1 → P2 → P3 → P4 → P5
2. ห้ามติ๊ก DONE จากการมีหน้า UI อย่างเดียว
3. งานการเงินต้องมี state guard, idempotency, permission, audit และ concurrency evidence
4. งาน production ต้องระบุ environment, commit และผล verification
5. ห้ามเพิ่ม backlog ใหม่ในไฟล์เก่าโดยไม่เพิ่มที่ไฟล์นี้ก่อน
6. ห้ามใช้ `pnpm prisma db push --force-reset`
7. ห้าม deploy, migrate production, rotate secret หรือเปิดเงินจริงโดยไม่มีคำสั่งชัดเจน

---

# ภาพรวมปัจจุบัน

| กลุ่ม | สถานะจริง |
|---|---|
| Monorepo / API / Admin / Member foundation | ✅ DONE |
| Prisma / migration foundation | ✅ DONE |
| Deposit / withdrawal workflow safety | ✅ DONE ฝั่ง source; production regression บางส่วนยังต้องยืนยัน |
| Admin auth / owner / role / 2FA | 🟡 PARTIAL — เหลือ credentialed production verification |
| Permission coverage | 🟡 PARTIAL — static audit ผ่าน; read-only browser verification ยังไม่ครบ |
| Member home / game discovery | ✅ DONE |
| Member profile / security | 🟡 PARTIAL — เหลือ visual/accessibility regression |
| Notifications | 🟡 PARTIAL — channel preferences ยังไม่ครบ |
| Support / FAQ | 🟡 PARTIAL — attachment storage ยังไม่มี |
| Admin settings / CMS | ✅ DONE ตาม scope ปัจจุบัน; binary upload ยังเป็นข้อจำกัดที่ระบุไว้ |
| Reports / Activity / Risk / Security Admin | ✅ DONE ตาม checklist ปัจจุบัน |
| Promotion / Bonus / Affiliate / Commission | 🟡 PARTIAL — ห้ามเปิดเงินจริง |
| KYC / blacklist / document workflow | 🟡 PARTIAL ถึง 🔴 TODO |
| Real provider integration | ⏸️ Code readiness complete; external UAT blocked |
| Code structure refactor | 🟡 PARTIAL — เริ่มแล้วหลายส่วน แต่ยังไม่ครบ |
| Performance / storage / CI hardening | 🟡 PARTIAL |

---

# P0 — Core source และ finance blockers

## M-001 Prisma schema

สถานะ: ✅ DONE

- [x] ลบ enum ซ้ำ
- [x] ตรวจ migration และ production schema ตาม runbook
- [x] `prisma generate` ผ่านใน API build
- [x] ไม่มี script แก้ schema ระหว่าง build

## M-002 Deposit workflow

สถานะ: ✅ DONE

- [x] แก้ declaration ซ้ำของ `detectedAmount`
- [x] แก้ declaration ซ้ำของ `transferredAt`
- [x] ตรวจ owner / no-claim / expired-claim / non-owner
- [x] ใช้ row lock และ state-transition guard
- [x] ใช้ idempotency key ตอน credit
- [x] cleanup storage เมื่อ transaction fail
- [x] เพิ่ม `pnpm audit:finance-workflows`
- [x] มี state-transition / idempotency / concurrency tests
- [x] ตรวจ production migration ตาม runbook

## M-003 Withdrawal workflow

สถานะ: ✅ DONE

- [x] ใช้ status จาก row ที่ lock จริง
- [x] มี `assertClaimOwner()`
- [x] ใช้ row lock และ state-transition guard
- [x] ตรวจ proof upload ซ้ำด้วย hash / transaction reference
- [x] cleanup storage เมื่อ transaction fail หรือ idempotent upload
- [x] ใช้ idempotency key ตอน complete
- [x] ลบ legacy direct-complete endpoint
- [x] มี state-transition / idempotency / concurrency tests
- [x] ตรวจ production migration ตาม runbook

## M-004 ลบ build-time source mutation

สถานะ: ✅ DONE

- [x] แก้ source/schema จริง
- [x] เอา `db:fix-schema` ออกจาก `db:generate`
- [x] เอา `fix:api-workflows` ออกจาก `build:api`
- [x] ลบ scripts ที่เขียนทับ source ระหว่าง build
- [x] API build ผ่านโดยไม่พึ่ง source mutation

> สถานะ P0: ✅ ปิดครบฝั่ง source และ migration foundation

---

# P1 — Security / เงิน / Production verification

## M-005 Admin owner/account protection

สถานะ: 🟡 PARTIAL

ทำแล้ว:
- [x] ป้องกัน suspend / downgrade / remove owner คนสุดท้าย
- [x] Ownership transfer flow แบบ transaction
- [x] Step-up authentication และ current 2FA confirmation
- [x] Audit ownership transfer
- [x] Owner recovery readiness/status
- [x] Suspend / lock / unlock non-protected admin
- [x] บังคับเหตุผลทุก lifecycle action
- [x] Revoke session หลัง suspend/lock
- [x] Account status timeline
- [x] Per-account session management
- [x] Login history ต่อ admin account

เหลือ:
- [ ] Production verification ด้วย credentialed admin session

## M-006 Permission coverage audit

สถานะ: 🟡 PARTIAL

หลักฐาน:
- `pnpm audit:admin-permissions` ผ่าน
- `pnpm audit:admin-ui-permissions` ผ่าน
- Admin route 67/67 protected หรือ allowlisted
- API controller audit ไม่พบ unguarded controller

Checklist:
- [x] ตรวจ admin route / sidebar / widget / export
- [x] เพิ่ม permission guard ให้ finance, wallet, bank account และ support
- [x] เพิ่ม automated permission audit ใน Quality Gate
- [ ] ยืนยัน read-only user มองไม่เห็น mutation controls ผ่าน browser จริง

## M-007 Trusted proxy / IP / rate limit

สถานะ: 🟡 PARTIAL

- [x] `TRUSTED_PROXY_HOPS`
- [x] RequestContext สำหรับ IP / request ID / user agent
- [x] ใช้ `req.ip` ตาม trusted proxy policy
- [x] Rate limit แยก account และ trusted IP
- [x] Progressive lockout
- [x] Suspicious login/device audit
- [ ] ทดสอบผ่าน reverse proxy จริง

## M-008 Token/session security

สถานะ: 🟡 PARTIAL

- [x] Admin access token อยู่ใน memory
- [x] HttpOnly / Secure / SameSite refresh cookie
- [x] แยก admin/member cookie
- [x] Refresh rotation / reuse revoke
- [x] CSRF origin check สำหรับ mutation
- [x] ลบ legacy localStorage fallback หลัง migration
- [x] `audit:admin-token-storage`
- [x] `audit:admin-xss`
- [x] Optional dynamic login-cookie smoke
- [ ] Production login/cookie smoke ผ่าน deployed web URL

## M-009 Anti-bot

สถานะ: 🟡 PARTIAL

- [x] TURNSTILE / RECAPTCHA / HCAPTCHA
- [x] AES-256-GCM secret storage
- [x] Validate site key / secret ก่อน enable
- [x] Sanitized connection test
- [x] Admin login / member login / register integration
- [x] Password reset integration
- [x] Adaptive challenge
- [x] Emergency mode
- [x] Permission และ audit log
- [ ] Production provider/runtime verification

## M-010 Finance/provider verification

สถานะ: 🟡 PARTIAL

- [x] Transfer reverse / force-fail / retry safety
- [x] Idempotency key และ WalletLedger ทุก mutation
- [x] Admin note / audit log
- [x] Provider preset atomic apply
- [x] Credential create / rotate / mask / disable / lastUsedAt
- [x] Sanitized health check
- [x] Webhook signature / duplicate / idempotency
- [x] Test mode ห้าม settle เงินจริง
- [x] Reconciliation relation / note / timeline
- [ ] รัน finance DB concurrency suite กับ test database จริง
- [ ] Production provider/migration verification

---

# P2 — Product completion

## M-011 Member home/game discovery

สถานะ: ✅ DONE

- [x] Featured / recently played
- [x] Promotion/banner slots
- [x] Categories / provider filter
- [x] Search / favorites
- [x] Maintenance / disabled states
- [x] Fallback images/icons
- [x] Market-style mobile polish

## M-012 Deposit/withdraw member flow

สถานะ: 🟡 PARTIAL

- [x] Guided withdrawal steps
- [x] Review step ก่อน submit
- [x] Deposit expiration behavior
- [x] Private slip storage/access control
- [x] Status cards สม่ำเสมอ
- [ ] Responsive regression และ manual money-flow regression

## M-013 Member profile/security

สถานะ: 🟡 PARTIAL

- [x] Loading / error / retry / empty state
- [x] Duplicate phone/email handling
- [x] Unsaved changes warning
- [x] Password strength/mismatch
- [x] Session invalidation หลัง password change/reset
- [x] Device / IP / login history
- [x] Logout other/all devices
- [ ] Visual/accessibility regression

## M-014 Notifications

สถานะ: 🟡 PARTIAL

- [x] Group by date / deep link
- [x] Mark one/all as read
- [x] Archive backend state
- [x] Notification preference route
- [x] Keyboard / screen reader / zoom pass
- [ ] Optimistic delete/archive rollback QA
- [ ] Email / SMS / push channel preferences

## M-015 Support/FAQ

สถานะ: 🟡 PARTIAL

- [x] FAQ search/category
- [x] Ticket pagination/search/filter
- [x] Draft/timeline/preview
- [x] Close/reopen/polling fallback
- [x] Link ticket กับ money/provider flow
- [ ] Attachment upload / MIME / size / storage policy

## M-016 Admin settings/CMS

สถานะ: ✅ DONE ตาม scope ปัจจุบัน

- [x] Persistence ทุก section
- [x] Permission guard และ audit log
- [x] Contrast / critical toggle validation
- [x] Legal version/date/preview
- [x] Campaign CRUD/date/bonus/turnover validation
- [x] Search / unsaved warning / reset
- [x] ระบุชัดว่า asset library ยังเป็น URL-backed และไม่มี binary upload

## M-017 Reports/activity/risk/security admin

สถานะ: ✅ DONE ตาม checklist ปัจจุบัน

- [x] Report aggregate/filter และ CSV
- [x] Activity pagination/detail/long JSON
- [x] Risk filters/related links/bulk action
- [x] Auto-close suggestion
- [x] Security lifecycle actions
- [x] Permission coverage ทุก route/widget/export

## M-018 Promotion/bonus/affiliate/commission

สถานะ: 🟡 PARTIAL — **ห้ามเปิดเงินจริง**

- [x] Campaign/bonus lifecycle
- [x] Turnover tracking
- [x] Member claim/admin review
- [x] Referral/agent code
- [x] Commission calculation/ledger พร้อม payout disabled guard
- [x] Downline/report correctness
- [ ] แยก domain model ออกจาก `RiskAlert.metadata`
- [ ] Wallet settlement path ที่ปลอดภัย
- [ ] Audit/concurrency/idempotency tests ก่อนเปิดเงินจริง

## M-019 CMS/content

สถานะ: ✅ DONE ตาม scope ปัจจุบัน

- [x] Mobile banner / announcement / popup
- [x] Maintenance notice
- [x] Category ordering / featured games
- [x] Asset/broken URL validation

## M-020 KYC/risk

สถานะ: 🟡 PARTIAL ถึง 🔴 TODO

- [ ] Phone OTP/SMS verification
- [x] Bank verification
- [x] Duplicate bank detection
- [x] Risk status lifecycle
- [ ] Blacklist/watchlist model และ reason taxonomy
- [ ] KYC document workflow / retention / access policy

---

# P3 — Provider external dependency

## M-021 Real provider integration

สถานะ: ✅ CODE READINESS / ⏸️ EXTERNAL UAT BLOCKED

ทำแล้ว:
- [x] Endpoint contract สำหรับ launch/balance/transfer/game list/bet history/webhook/health
- [x] Credential contract สำหรับ API key/secret/merchant/agent/webhook secret
- [x] Safe gates ปิดเงินจริงโดย default
- [x] Readiness adapter และ registry
- [x] Vendor adapter template
- [x] Generic HMAC webhook verification tests
- [x] Preset/registry tests

รอภายนอก:
- [ ] Vendor API/UAT/production URL
- [ ] Credential จริง
- [ ] Signature/error/request-response spec จริง
- [ ] IP whitelist/callback requirement
- [ ] Provider-specific UAT dry-run

---

# P4 — Code structure refactor

สถานะรวม: 🟡 PARTIAL

## R-001 แยก service ใหญ่

เป้าหมาย: game-platform, game-platform-money, money-ops, deposit-workflow, promotions, affiliates

- [ ] แยก query/command
- [ ] แยก mapper/formatter/audit
- [ ] แยก provider orchestration
- [ ] แยก money mutation/reporting
- [ ] เพิ่ม regression tests ก่อน/หลัง refactor

## R-002 แยก domain/module ทับซ้อน

- [x] Endpoint ownership matrix
- [x] Source-of-truth mapping
- [x] Backward-compatible migration plan
- [x] Deprecation plan
- [ ] รวม query ซ้ำ
- [ ] ย้าย route ตาม ownership matrix

## R-003 แยก RiskAlert domain

- [ ] AffiliateProfile / AffiliateLink / CommissionLedger
- [ ] PromotionCampaign / PromotionClaim / BonusLedger
- [ ] Relation / index / constraint
- [ ] Migration / backfill
- [ ] ย้าย service/frontend types
- [ ] หยุดใช้ RiskAlert เป็น generic record

## R-004 รวม API client

สถานะ: 🟡 PARTIAL

- [x] สร้าง `packages/api-client`
- [x] รวม auth refresh / retry / error / cache
- [x] ย้าย auth flows หลักมาใช้ shared client
- [x] ลบ direct `fetch(API_URL)`
- [x] เพิ่ม client tests
- [ ] ตรวจและย้าย local `/api/...` fetch ที่ควรใช้ client กลาง
- [ ] ยืนยันทุกหน้าไม่มี duplicate API helper

## R-005 ลด any / เพิ่ม DTO

- [x] Shared `AdminActor` / `MemberActor`
- [ ] DTO สำหรับทุก admin/member body
- [ ] ลบ `as any` ที่กลบ enum/status
- [ ] เปิด strict checks เพิ่ม
- [ ] CI ห้าม any เพิ่ม

## R-006 รวม UI/CSS

- [x] ลบ legacy admin UI component ที่ไม่ใช้
- [x] ลบ `packages/ui` ที่ว่างและไม่มี consumer
- [ ] รวม design tokens/responsive rules
- [ ] ลด CSS mobile/desktop ซ้ำ
- [ ] Visual regression

## R-007 แยก page component ใหญ่

เป้าหมาย: register, deposit-client, withdraw, game-providers, content-center, promotion-center, security

- [ ] แยก hooks/components/validation/formatter
- [ ] เพิ่ม component/unit tests

---

# P5 — Performance / Storage / CI

## M-022 Query/pagination

สถานะ: 🟡 PARTIAL

- [ ] เปลี่ยน hard-coded take 200/300/500 เป็น pagination
- [ ] Cursor pagination สำหรับ audit/ledger
- [ ] ใช้ `select` ลด payload
- [ ] Composite indexes และ EXPLAIN ANALYZE
- [ ] N+1 / slow-query metrics

## M-023 Dashboard read model/cache

- [ ] Dashboard query service
- [ ] Aggregate/summary strategy
- [ ] Cache TTL/invalidation

## M-024 Storage security

- [ ] Maximum file size
- [ ] MIME/content validation
- [ ] Malware/content scan policy
- [x] Cleanup เมื่อ finance transaction fail/duplicate
- [ ] Signed URL
- [ ] ลด data URL ขนาดใหญ่

## M-025 Lint/typecheck/tests

- [ ] Lint script ทุก app
- [ ] ESLint config กลาง
- [ ] Formatting/unused vars cleanup
- [ ] แยก unit/integration/database/concurrency/e2e/visual
- [ ] เพิ่ม state/permission/idempotency/race/API refresh tests

## M-026 CI/config/dependency

ทำแล้ว:
- [x] CI frozen lockfile
- [x] Prisma validate/generate/build steps
- [x] Quality Gate บน branch ล่าสุด
- [x] PostgreSQL service/test database ใน Build workflow
- [x] Finance DB test job อยู่ใน workflow

เหลือ:
- [ ] ยืนยัน finance DB tests รันจริงและไม่ skip บน branch ล่าสุด
- [ ] Production migration/rollback verification
- [ ] Fixture builders/isolated cleanup
- [ ] Test artifacts/failure summary
- [ ] Node/pnpm version alignment
- [ ] Dependency audit
- [ ] Env/startup validation
- [ ] ห้าม default production secret
- [ ] แยก public/server-only env

---

# งานที่ถูก Block

| งาน | Blocker |
|---|---|
| Authenticated visual regression | ไม่มี Playwright browser/credential ใน environment ที่ใช้ตรวจ |
| Railway deployed smoke | Local proxy เคยตอบ `CONNECT tunnel failed, response 403` |
| Read-only admin verification | ไม่มี credentialed read-only account |
| Finance DB concurrency run | ไม่มี test database configuration ใน environment ปัจจุบัน |
| Real provider UAT | รอ vendor docs, endpoint, credentials และ whitelist |
| Production cookie/session smoke | รอ deployed Admin/Member URL และ test credentials |

---

# ลำดับทำงานจริง

## Batch A — Core source
- [x] M-001 ถึง M-004

## Batch B — Security / เงิน / Production
- [ ] ปิด production verification ของ M-005 ถึง M-010
- [ ] รัน finance DB concurrency tests จริง
- [ ] ปิด storage security ที่เกี่ยวข้อง

## Batch C — Product completion
- [ ] ปิด M-012 ถึง M-015
- [ ] ออกแบบ domain model และ settlement guard สำหรับ M-018
- [ ] ปิด KYC/blacklist/document workflow ของ M-020

## Batch D — Refactor
- [ ] R-001 ถึง R-007

## Batch E — Production readiness
- [ ] M-022 ถึง M-026
- [ ] Staging migration/rollback
- [ ] E2E/visual smoke
- [ ] Deployment health/version verification

---

# Definition of Done

- [x] ไม่มี P0 source blocker
- [x] Prisma validate/generate ผ่านโดยไม่แก้ source ระหว่าง build
- [ ] Typecheck/lint/build ผ่านทุก package ในคำสั่งเดียว
- [ ] Finance concurrency tests ผ่านกับ PostgreSQL จริง
- [x] Static permission coverage audit ผ่าน
- [ ] Read-only permission browser regression ผ่าน
- [ ] ไม่มี duplicate UI/API helper ที่ยังใช้งาน
- [ ] ไม่มี direct upstream API call นอก shared client/proxy policy
- [ ] Financial/admin DTO ครบ
- [ ] Query หนักมี pagination/index/limit
- [ ] Session/token policy ผ่าน production security smoke
- [ ] Migration staging/rollback ผ่าน
- [ ] E2E/visual smoke ผ่านครบ viewport หลัก
- [ ] Deployment health/version ตรง commit ล่าสุด

---

# เอกสารเดิม

เอกสารเดิมเก็บเป็น reference ชั่วคราวและห้ามเพิ่ม backlog ใหม่โดยไม่อัปเดต master นี้ก่อน

- [ ] เพิ่มลิงก์กลับมาที่ master ในเอกสารเดิมทุกไฟล์
- [ ] ตรวจ duplicate backlog รอบสุดท้าย
- [ ] Archive เอกสารเดิมหลัง master เสถียร
