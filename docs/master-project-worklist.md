# Master Project Worklist

เอกสารนี้เป็น source of truth หลักสำหรับสถานะงานของ `platform-starter` โดยอ้างอิงจาก source code, scripts, tests, workflow และไฟล์ configuration ที่อยู่บน branch `main`

วันที่ตรวจล่าสุด: **2026-07-14**  
Branch อ้างอิง: **`main`**

## หลักการให้สถานะ

- ✅ DONE — มี implementation ใน repo และมี automated evidence ที่เหมาะสม
- 🟡 PARTIAL — มี implementation แล้ว แต่ยังขาด test, browser regression, production verification หรือส่วนประกอบสำคัญ
- 🔴 TODO — ยังไม่พบ implementation ที่ยืนยันได้ใน repo
- ⏸️ BLOCKED — ทำต่อไม่ได้โดยไม่มี credential, deployed URL, vendor document หรือ external decision

> การมีหน้า UI, route, script หรือ test file เพียงอย่างเดียวไม่ถือว่า DONE จนกว่าจะมีหลักฐานว่าพฤติกรรมสำคัญถูกตรวจจริง

## หลักฐานที่ตรวจพบใน repo

- Root scripts มี build, test, lint, Prisma, permission audit, finance audit, token/XSS audit, Playwright smoke และ visual commands
- `apps/api` มี Jest และ finance concurrency test command
- `apps/web-admin` และ `apps/web-member` มี build script แต่ยังไม่มี app-level lint/test script
- Build workflow ใช้ PostgreSQL 16, รัน Prisma validate/generate/migrate, API tests, finance concurrency tests และ build ทั้งสามแอป
- มี shared package `packages/api-client`
- Playwright smoke/visual config มีอยู่ แต่ผล browser regression ไม่ถือว่าผ่านจนกว่าจะมี workflow หรือ artifact ยืนยัน

---

# ภาพรวมสถานะจริง

| กลุ่ม | สถานะ |
|---|---|
| Monorepo / API / Admin / Member foundation | ✅ DONE |
| Prisma schema และ CI migration path | ✅ DONE ใน CI; production rollback/verification ยังไม่ครบ |
| Deposit / withdrawal workflow safety | 🟡 PARTIAL — source/audit/tests มีแล้ว แต่ต้องยืนยัน DB test run ล่าสุดและ production flow |
| Admin auth / owner / role / 2FA | 🟡 PARTIAL — implementation มีแล้ว เหลือ credentialed regression |
| Permission coverage | 🟡 PARTIAL — static audits มีแล้ว เหลือ role-based browser regression |
| Member home / game discovery | 🟡 PARTIAL — feature หลักมีแล้ว เหลือ authenticated visual regression |
| Member profile / security | 🟡 PARTIAL |
| Notifications | 🟡 PARTIAL |
| Support / FAQ | 🟡 PARTIAL |
| Admin settings / CMS | 🟡 PARTIAL — URL-backed assets เท่านั้น และยังขาด browser regression |
| Reports / Activity / Risk / Security Admin | 🟡 PARTIAL — feature หลักมีแล้ว แต่ยังขาด authenticated regression |
| Promotion / Bonus / Affiliate / Commission | 🟡 PARTIAL — ห้ามเปิดเงินจริง |
| KYC / Blacklist / Document workflow | 🟡 PARTIAL ถึง 🔴 TODO |
| Real provider integration | ⏸️ Code readiness มีแล้ว; vendor UAT blocked |
| Code structure refactor | 🟡 PARTIAL |
| Performance / Storage / CI hardening | 🟡 PARTIAL |

---

# P0 — Core, schema และ financial safety

## M-001 Prisma schema และ migration

สถานะ: ✅ DONE สำหรับ repository/CI, 🟡 PARTIAL สำหรับ production

- [x] Prisma schema อยู่ที่ `prisma/schema.prisma`
- [x] Root build ไม่ใช้ source-mutation script
- [x] `db:generate` ใช้ `prisma generate`
- [x] Build workflow รัน Prisma validate, generate และ migrate deploy กับ PostgreSQL CI
- [ ] Staging migration/rollback verification
- [ ] Production migration status ตรงกับ commit ล่าสุด

## M-002 Deposit workflow

สถานะ: 🟡 PARTIAL

- [x] Row lock และ state-transition guard
- [x] Claim-owner checks
- [x] Credit idempotency
- [x] Storage cleanup path
- [x] Static finance workflow audit
- [x] Finance concurrency test file/command มีอยู่
- [ ] ยืนยัน finance DB suite บน commit ล่าสุดว่า run จริงและไม่ skip
- [ ] Credentialed end-to-end deposit regression

## M-003 Withdrawal workflow

สถานะ: 🟡 PARTIAL

- [x] Row lock และ state-transition guard
- [x] Claim-owner checks
- [x] Proof duplicate protection
- [x] Completion idempotency
- [x] Legacy direct-complete endpoint ถูกถอดออก
- [x] Finance concurrency test coverage มีอยู่
- [ ] ยืนยัน finance DB suite บน commit ล่าสุดว่า run จริงและไม่ skip
- [ ] Credentialed end-to-end withdrawal regression

## M-004 Build-time source mutation

สถานะ: ✅ DONE

- [x] `build:api` ใช้ Prisma generate และ Nest build โดยตรง
- [x] ไม่มี `db:fix-schema` ใน `db:generate`
- [x] ไม่มี `fix:api-workflows` ใน `build:api`

> P0 จะถือว่าปิดทั้งหมดได้เมื่อ finance DB run ล่าสุด, staging migration และ money-flow regression มีหลักฐานครบ

---

# P1 — Security, permissions และ production verification

## M-005 Admin owner/account protection

สถานะ: 🟡 PARTIAL

- [x] Last-owner protection
- [x] Ownership transfer transaction
- [x] Step-up/2FA confirmation
- [x] Lifecycle reason และ audit
- [x] Session revocation
- [x] Account timeline และ login history
- [ ] Credentialed owner transfer regression
- [ ] Production account lifecycle regression

## M-006 Permission coverage

สถานะ: 🟡 PARTIAL

- [x] `audit:admin-permissions`
- [x] `audit:admin-ui-permissions`
- [x] Finance/wallet/bank/support permission metadata
- [ ] Read-only role browser regression
- [ ] Mutation control hidden/blocked verification ทุก route สำคัญ

## M-007 Trusted proxy, IP และ rate limit

สถานะ: 🟡 PARTIAL

- [x] Trusted proxy configuration
- [x] Request context สำหรับ IP/request ID/user agent
- [x] Account/IP rate limiting
- [x] Progressive lockout
- [x] Suspicious-device audit
- [ ] Reverse-proxy integration test กับ deployed environment

## M-008 Token/session security

สถานะ: 🟡 PARTIAL

- [x] Shared admin API path และ memory access token policy
- [x] HttpOnly refresh cookie
- [x] แยก admin/member cookie
- [x] CSRF origin check
- [x] Token-storage static audit
- [x] Admin XSS-boundary static audit
- [ ] Deployed login/refresh/logout/cookie regression
- [ ] Session reuse/rotation regression ผ่าน browser/API จริง

## M-009 Anti-bot

สถานะ: 🟡 PARTIAL

- [x] Turnstile/reCAPTCHA/hCaptcha provider support
- [x] Encrypted secret storage
- [x] Route configuration และ adaptive/emergency mode
- [x] Password-reset integration
- [ ] Provider-specific production test
- [ ] Failure/fallback regression ใน deployed environment

## M-010 Finance/provider operations

สถานะ: 🟡 PARTIAL

- [x] Transfer reverse/fail/retry guards
- [x] Ledger/idempotency/audit paths
- [x] Credential lifecycle และ sanitized health check
- [x] Webhook signature/duplicate handling
- [x] Real-money safe gates
- [ ] DB concurrency run evidence บน commit ล่าสุด
- [ ] Provider reconciliation regression
- [ ] Production migration/provider verification

---

# P2 — Product completion

## M-011 Member home/game discovery

สถานะ: 🟡 PARTIAL

- [x] Featured/recent/favorites
- [x] Search/category/provider filter
- [x] CMS promotion slots
- [x] Maintenance/disabled/fallback states
- [x] Mobile UI implementation
- [ ] Authenticated six-viewport visual regression
- [ ] Provider-down/game-launch browser regression

## M-012 Deposit/withdraw member UI

สถานะ: 🟡 PARTIAL

- [x] Guided steps และ review before submit
- [x] Expiration handling
- [x] Private slip response/access boundary
- [x] Workflow status presentation
- [ ] Responsive money-flow regression
- [ ] Duplicate/retry/error-state browser regression

## M-013 Member profile/security

สถานะ: 🟡 PARTIAL

- [x] Profile/edit/password/security/session routes
- [x] Duplicate phone/email handling
- [x] Unsaved-change warning
- [x] Password validation
- [x] Session invalidation/revocation controls
- [ ] Authenticated accessibility/visual regression

## M-014 Notifications

สถานะ: 🟡 PARTIAL

- [x] Notification list/group/deep link
- [x] Read/archive backend behavior
- [x] Preference route
- [ ] Email/SMS/push channel model และ UI
- [ ] Optimistic update rollback regression

## M-015 Support/FAQ

สถานะ: 🟡 PARTIAL

- [x] FAQ search/category
- [x] Ticket pagination/filter/search
- [x] Draft/preview/timeline
- [x] Close/reopen/polling fallback
- [x] Money/provider reference linking
- [ ] Attachment model/storage/MIME/size policy
- [ ] Support thread browser regression

## M-016 Admin settings/CMS

สถานะ: 🟡 PARTIAL

- [x] Settings persistence paths
- [x] Permission/audit paths
- [x] Legal, branding, campaign validation
- [x] Unsaved-change/reset behavior
- [x] URL-backed asset validation
- [ ] Binary asset upload/storage policy หรือยืนยันอย่างเป็นทางการว่า out of scope
- [ ] Authenticated settings/CMS regression

## M-017 Reports/activity/risk/security admin

สถานะ: 🟡 PARTIAL

- [x] Report filters/CSV paths
- [x] Activity detail JSON/pagination
- [x] Risk filters/links/bulk actions/auto-close suggestions
- [x] Security lifecycle UI
- [ ] Data correctness regression กับ seeded database
- [ ] Mobile/desktop authenticated visual regression

## M-018 Promotion/bonus/affiliate/commission

สถานะ: 🟡 PARTIAL — **ห้ามเปิดเงินจริง**

- [x] Campaign/claim/review flow
- [x] Turnover tracking logic
- [x] Referral/downline/commission calculation
- [x] Payout disabled guard
- [ ] แยก domain model ออกจาก `RiskAlert.metadata`
- [ ] Wallet settlement path
- [ ] Concurrency/idempotency/settlement tests

## M-019 CMS/member content

สถานะ: 🟡 PARTIAL

- [x] Banner/announcement/popup/maintenance content
- [x] Category ordering และ featured content
- [x] Broken URL validation
- [ ] Visual regression ทุก viewport
- [ ] Binary asset lifecycle ถ้าจะรองรับ upload จริง

## M-020 KYC/risk

สถานะ: 🟡 PARTIAL ถึง 🔴 TODO

- [x] Bank review และ duplicate-bank detection
- [x] Risk status lifecycle
- [ ] Phone OTP/SMS verification
- [ ] Blacklist/watchlist model และ reason taxonomy
- [ ] KYC document upload/retention/access policy

---

# P3 — Real provider

## M-021 Provider integration

สถานะ: ⏸️ CODE READY / EXTERNAL UAT BLOCKED

- [x] Generic endpoint/credential contracts
- [x] Safe gates ปิดเงินจริง
- [x] Readiness adapter/registry/template
- [x] Generic signature tests
- [ ] Vendor endpoint และ credentials
- [ ] Vendor signature/error contract
- [ ] IP whitelist/callback requirements
- [ ] Provider-specific UAT

---

# P4 — Refactor

## R-001 Service decomposition

สถานะ: 🔴 TODO

- [ ] แยก query/command
- [ ] แยก mapper/audit/formatter
- [ ] แยก provider orchestration
- [ ] เพิ่ม regression tests ก่อน refactor

## R-002 Module ownership

สถานะ: 🟡 PARTIAL

- [x] Endpoint ownership matrix
- [x] Migration/deprecation plan
- [ ] รวม query ซ้ำ
- [ ] ย้าย route ตาม ownership plan

## R-003 RiskAlert domain separation

สถานะ: 🔴 TODO

- [ ] Promotion/bonus models
- [ ] Affiliate/commission models
- [ ] Constraints/indexes/backfill
- [ ] Service/frontend migration

## R-004 Shared API client

สถานะ: 🟡 PARTIAL

- [x] `packages/api-client`
- [x] Shared URL/header/error/retry/cache/auth-refresh behavior
- [x] Admin/member workspace integration
- [x] Auth flow migration บางส่วน
- [ ] ตรวจ local `/api/*` calls ทุก route
- [ ] ลบ duplicate API helpers ที่ยังเหลือ

## R-005 DTO/type strictness

สถานะ: 🟡 PARTIAL

- [x] Shared `AdminActor`/`MemberActor`
- [ ] DTO ครบทุก mutation body
- [ ] ลด unsafe `any`/casts
- [ ] Strict checks และ CI guard

## R-006 UI/CSS consolidation

สถานะ: 🟡 PARTIAL

- [x] ลบ unused legacy admin UI files
- [x] ลบ empty unused `packages/ui`
- [ ] รวม design tokens
- [ ] ลด responsive CSS ซ้ำ
- [ ] Visual regression

## R-007 Large-page decomposition

สถานะ: 🔴 TODO

- [ ] แยก register/deposit/withdraw/provider/content/promotion/security pages
- [ ] เพิ่ม component/unit tests

---

# P5 — Performance, storage และ CI

## M-022 Query/pagination

สถานะ: 🔴 TODO เป็นส่วนใหญ่

- [ ] Audit hard-coded large `take`
- [ ] Cursor pagination สำหรับ audit/ledger
- [ ] Select projection ลด payload
- [ ] Composite indexes/EXPLAIN ANALYZE
- [ ] N+1/slow-query metrics

## M-023 Dashboard read model/cache

สถานะ: 🔴 TODO

- [ ] Dashboard query service/read model
- [ ] Aggregate strategy
- [ ] Cache TTL/invalidation

## M-024 Storage security

สถานะ: 🟡 PARTIAL

- [x] Finance cleanup paths
- [ ] Global file-size limits
- [ ] MIME/content validation
- [ ] Malware/content scan policy
- [ ] Signed URL policy
- [ ] Data URL reduction

## M-025 Lint/typecheck/tests

สถานะ: 🟡 PARTIAL

- [x] Root `lint`/`test`/`build` commands มีอยู่
- [x] API Jest scripts มีอยู่
- [x] Playwright smoke/visual scripts มีอยู่
- [ ] App-level lint scripts สำหรับ API/Admin/Member
- [ ] Shared ESLint/format config
- [ ] Web unit/component tests
- [ ] Visual artifacts ใน CI
- [ ] Test taxonomy และ failure summary

## M-026 CI/config/dependency

สถานะ: 🟡 PARTIAL

- [x] Frozen lockfile
- [x] Node 22 และ pnpm 9 ใน Build workflow
- [x] PostgreSQL CI service
- [x] Prisma validate/generate/migrate
- [x] API test และ finance DB test commands ใน workflow
- [x] API/Admin/Member builds ใน workflow
- [ ] ยืนยัน latest main workflow result และ finance DB test ไม่ skip
- [ ] Cache/artifact/failure summary
- [ ] Staging rollback job
- [ ] Env schema/startup validation
- [ ] Dependency/security audit
- [ ] Production secret guard

---

# External blockers

| งาน | Blocker |
|---|---|
| Authenticated Admin/Member regression | ต้องมี seeded test credentials |
| Deployed smoke/cookie/session test | ต้องมี deployed Admin/Member URLs และ credentials |
| Real provider UAT | ต้องมี vendor docs, endpoint, credentials และ whitelist |
| Production migration verification | ต้องมี production access/approved run |
| Binary uploads/KYC/support attachments | ต้องตัดสินใจ storage, retention และ security policy |

---

# ลำดับทำงานถัดไป

1. ตรวจ latest GitHub Actions run และบันทึก finance DB test evidence
2. เพิ่ม seeded non-production Admin/Member accounts สำหรับ browser tests
3. ปิด M-005 ถึง M-010 ด้วย credentialed regression
4. ปิด M-011 ถึง M-017 และ M-019 ด้วย authenticated visual/functional regression
5. ออกแบบ domain models และ settlement safety สำหรับ M-018
6. ทำ M-020 เฉพาะหลังตัดสินใจ OTP/KYC storage policy
7. ทำ refactor P4 หลัง regression coverage พร้อม
8. ปิด performance/storage/CI P5 ก่อน production launch

# Definition of Done ทั้งโปรเจกต์

- [x] CI มี Prisma validate/generate/migrate และ build ทุก app
- [x] Static finance/permission/token/XSS audit commands มีอยู่
- [ ] Latest main CI ผ่านและเก็บหลักฐานครบ
- [ ] Finance concurrency tests ผ่าน PostgreSQL จริงโดยไม่ skip
- [ ] Admin/Member authenticated regression ผ่าน
- [ ] Production/staging migration และ rollback ผ่าน
- [ ] ไม่มี financial settlement path ที่ขาด idempotency/concurrency/audit
- [ ] ไม่มี critical route ที่ขาด permission regression
- [ ] Storage/upload policy ครบ
- [ ] Query หนักมี pagination/index evidence
- [ ] Provider-specific UAT ผ่านก่อนเปิดเงินจริง
- [ ] Deployment health/version ตรง commit ที่อนุมัติ

# เอกสารเดิม

ไฟล์ต่อไปนี้เป็น reference เท่านั้น ห้ามใช้เป็น source of truth ใหม่:

- `docs/remaining-work-backlog.md`
- `docs/detailed-remaining-work-backlog.md`
- `docs/code-structure-refactor-plan.md`
- `docs/current-execution-status.md`
- `docs/master-worklist.md`

- [ ] เพิ่มลิงก์กลับมาที่ไฟล์นี้ในเอกสารเดิม
- [ ] ตรวจ duplicate backlog รอบสุดท้าย
- [ ] Archive เอกสารเดิมหลังทีมยืนยัน master นี้