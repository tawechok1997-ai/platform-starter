# Master Project Worklist

เอกสารนี้เป็น source of truth หลักสำหรับสถานะงานของ `platform-starter` โดยอ้างอิงจาก source code, commit history, scripts, tests, workflows และ configuration บน branch `main`

วันที่ตรวจล่าสุด: **2026-07-15**  
Branch อ้างอิง: **`main`**

## หลักการให้สถานะ

- ✅ DONE — มี implementation และ automated/closure evidence ที่เหมาะสม
- 🟡 PARTIAL — มี implementation แล้ว แต่ยังขาด regression, production verification หรือส่วนประกอบสำคัญ
- 🔴 TODO — ยังไม่พบ implementation ที่ยืนยันได้
- ⏸️ BLOCKED — ต้องรอ credentials, deployed environment, vendor document หรือ external decision

> สถานะต้องอ้างอิงจากโค้ดและหลักฐานใน repo ไม่ใช่ checkbox เพียงอย่างเดียว

---

# ภาพรวมสถานะจริง

| กลุ่ม | สถานะ |
|---|---|
| Monorepo / API / Admin / Member foundation | ✅ DONE |
| Prisma schema และ CI migration path | ✅ DONE ใน CI; production rollback/verification ยังไม่ครบ |
| Deposit / withdrawal workflow safety | 🟡 PARTIAL — DB concurrency ผ่าน เหลือ credentialed production flow |
| Admin auth / owner / role / 2FA | 🟡 PARTIAL — implementation พร้อม เหลือ credentialed regression |
| Permission coverage | 🟡 PARTIAL — static/policy coverage พร้อม เหลือ role-based browser regression |
| Member product flows | 🟡 PARTIAL — feature หลักพร้อม เหลือ authenticated functional/visual regression |
| Promotion / Bonus / Affiliate / Commission | ✅ DONE — ห้ามเปิดเงินจริงจนกว่า provider-specific UAT ผ่าน |
| KYC / Blacklist / Document workflow | 🟡 PARTIAL — backend พร้อม เหลือ UI, PostgreSQL evidence บางส่วน และ deployed regression |
| Real provider integration | ⏸️ CODE READY / EXTERNAL UAT BLOCKED |
| P4 Backend architecture R-001 ถึง R-011 | ✅ DONE |
| P4 Frontend/UI/Observability R-012 ถึง R-014 | 🟡 IN PROGRESS |
| Performance / Storage / Production hardening | 🟡 PARTIAL |

---

# P0 — Core, schema และ financial safety

## M-001 Prisma schema และ migration

สถานะ: ✅ DONE สำหรับ repository/CI, 🟡 PARTIAL สำหรับ production

- [x] Prisma schema และ migration path
- [x] Prisma validate/generate/migrate deploy ใน CI
- [x] ไม่มี build-time source mutation
- [ ] Staging migration/rollback verification
- [ ] Production migration status ตรงกับ approved commit

## M-002 Deposit workflow

สถานะ: 🟡 PARTIAL

- [x] Row lock และ state-transition guard
- [x] Claim-owner checks
- [x] Credit idempotency
- [x] Storage cleanup path
- [x] Static workflow audit
- [x] PostgreSQL finance concurrency suite ผ่านโดยไม่ skip
- [ ] Credentialed end-to-end deposit regression

## M-003 Withdrawal workflow

สถานะ: 🟡 PARTIAL

- [x] Row lock และ state-transition guard
- [x] Claim-owner checks
- [x] Proof duplicate protection
- [x] Completion idempotency
- [x] Legacy direct-complete endpoint ถูกถอดออก
- [x] PostgreSQL finance concurrency suite ผ่านโดยไม่ skip
- [ ] Credentialed end-to-end withdrawal regression

## M-004 Build-time source mutation

สถานะ: ✅ DONE

- [x] `build:api` ใช้ Prisma generate และ Nest build โดยตรง
- [x] ไม่มี schema/workflow source mutation ใน build path

---

# P1 — Security, permissions และ production verification

## M-005 Admin owner/account protection

สถานะ: 🟡 PARTIAL

- [x] Last-owner protection และ ownership transfer transaction
- [x] Step-up/2FA confirmation
- [x] Lifecycle reason/audit/session revocation
- [x] Account timeline และ login history
- [ ] Credentialed owner-transfer regression
- [ ] Production account lifecycle regression

## M-006 Permission coverage

สถานะ: 🟡 PARTIAL

- [x] API/UI permission audits
- [x] Finance/wallet/bank/support permission metadata
- [x] Domain authorization policies และ resource-level authorization
- [ ] Read-only role browser regression
- [ ] Mutation control hidden/blocked verification ทุก route สำคัญ

## M-007 Trusted proxy, IP และ rate limit

สถานะ: 🟡 PARTIAL

- [x] Trusted proxy configuration และ request context
- [x] Account/IP rate limiting และ progressive lockout
- [x] Suspicious-device audit
- [ ] Reverse-proxy integration test ใน deployed environment

## M-008 Token/session security

สถานะ: 🟡 PARTIAL

- [x] Shared API path และ memory access-token policy
- [x] HttpOnly refresh cookies แยก Admin/Member
- [x] CSRF origin check และ token/XSS static audits
- [ ] Deployed login/refresh/logout/cookie regression
- [ ] Session reuse/rotation regression ผ่าน browser/API จริง

## M-009 Anti-bot

สถานะ: 🟡 PARTIAL

- [x] Turnstile/reCAPTCHA/hCaptcha support
- [x] Encrypted secret storage และ adaptive/emergency modes
- [x] Password-reset integration
- [ ] Provider-specific production test
- [ ] Failure/fallback regression ใน deployed environment

## M-010 Finance/provider operations

สถานะ: 🟡 PARTIAL

- [x] Reverse/fail/retry guards
- [x] Ledger/idempotency/audit paths
- [x] Credential lifecycle และ sanitized health checks
- [x] Webhook signature/duplicate handling
- [x] Real-money safety gates และ DB concurrency evidence
- [ ] Provider reconciliation regression
- [ ] Production migration/provider verification

---

# P2 — Product completion

## M-011 ถึง M-019

สถานะรวม: 🟡 PARTIAL ยกเว้น M-018 ✅ DONE

- [x] Member home/game discovery implementation
- [x] Deposit/withdraw guided UI และ workflow status
- [x] Member profile/security/session controls
- [x] Notifications model/list/preferences
- [x] Support/FAQ/ticket lifecycle และ attachment policy
- [x] Admin settings/CMS URL-backed assets
- [x] Reports/activity/risk/security Admin feature set
- [x] Promotion/bonus/affiliate/commission settlement และ PostgreSQL concurrency tests
- [x] CMS/member content implementation
- [ ] Authenticated six-viewport visual regression
- [ ] Provider-down/game-launch regression
- [ ] Responsive money-flow duplicate/retry/error regression
- [ ] Notification optimistic rollback regression
- [ ] Actual support binary/object-storage upload
- [ ] Authenticated Support/CMS/Reports regression
- [ ] Binary asset lifecycle หากรองรับ upload จริง

## M-020 KYC/risk

สถานะ: 🟡 PARTIAL

- [x] Bank review และ duplicate-bank detection
- [x] Risk lifecycle และ blacklist/watchlist domain
- [x] HMAC matching, override/release lifecycle และ audit
- [x] Enforcement ใน registration/profile/bank/withdrawal
- [x] KYC case/document lifecycle และ private storage policy
- [x] MIME/size/SHA-256 metadata และ retention cleanup
- [x] Phone OTP lifecycle และ PostgreSQL replay/brute-force/concurrency suite
- [ ] PostgreSQL integration/concurrency evidence สำหรับ watchlist/KYC document lifecycle
- [ ] Admin KYC UI และ Member KYC upload UI
- [ ] Authenticated deployed KYC/risk regression

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

# P4 — Professional Refactor และ Codebase Organization

## P4 Backend Definition of Done: R-001 ถึง R-011

สถานะ: ✅ DONE

- [x] ไม่มี controller สำคัญเรียก Prisma โดยตรงนอก documented boundary
- [x] ไม่มี circular dependency ระหว่าง module สำคัญ
- [x] Critical mutations มี DTO, authorization policy, transaction boundary และ audit
- [x] Critical paths มี strict/type/response guards ตาม closure scope
- [x] Frontend API access ผ่าน shared API client และ enforced allowlist
- [x] Module ownership และ public contracts ถูกบันทึก
- [x] Critical flows มี regression coverage ตามประเภทที่เหมาะสม
- [x] CI มี architecture, lint, typecheck, contract และ forbidden-import gates
- [x] Backend services ถูกแยก responsibility ตาม R-007 closure scope
- [x] Repository/transaction/query/security boundaries มี closure evidence

## R-001 Architecture inventory และ ownership

สถานะ: ✅ DONE

- [x] Endpoint/module/dependency/route ownership inventories
- [x] Critical-route database, side-effect, permission และ audit mapping
- [x] Circular/deep-import checks และ public entry points
- [x] Architecture inventory gate ใน CI

**หลักฐาน:** `docs/architecture/r001-closure.md`, `pnpm audit:r1-closure`

## R-002 Dependency rules และ module boundaries

สถานะ: ✅ DONE

- [x] Dependency direction และ domain/infrastructure boundaries
- [x] ESLint/import rules, forbidden imports และ circular scan
- [x] CI architecture gates และ documented exceptions

**หลักฐาน:** `docs/architecture/r002-closure.md`, `pnpm audit:r2-closure`

## R-003 Regression safety net

สถานะ: ✅ DONE

- [x] Test inventory และ characterization/state-transition/policy/error-contract coverage
- [x] Rollback/idempotency/test-skip guards
- [x] CI failure summary

**หลักฐาน:** `docs/architecture/r003-closure.md`, `pnpm audit:r3-closure`

## R-004 DTO, type strictness และ API contract

สถานะ: ✅ DONE

- [x] Mutation route inventory และ DTO coverage
- [x] Validation/normalization/enum/max-length contracts
- [x] Request/command/domain/response separation
- [x] Prisma response-boundary และ sensitive-field guards
- [x] Strict/type/error-code/contract regression gates

**หลักฐาน:** closure commit `210e5989948d2f9d97ef49760af08836b8344e9a`; CI closure gates `5323dd4a`, `3370d1a2`, `f01d3546`

## R-005 Shared API client consolidation

สถานะ: ✅ DONE

- [x] Shared URL/header/error/retry/cache/auth-refresh behavior
- [x] Admin/Member routes migrated under central-client allowlist
- [x] Typed domain requests, upload/private download และ error normalization
- [x] Duplicate helper prevention และ contract regressions

**หลักฐาน:** closure evidence commit `9de8c96c5d1b8d075ce121a61e66b83f2cb436b9`; workflow `080ccfeb`; closure gates `81b4fda2`

## R-006 CI quality baseline

สถานะ: ✅ DONE

- [x] App/package lint และ typecheck scripts
- [x] Shared ESLint/formatter config
- [x] Unused/forbidden/circular/schema/migration/test-skip gates
- [x] Browser console/network failure gate และ CI summaries

**หลักฐาน:** `docs/architecture/r006-closure.md`, `pnpm audit:r6-closure`, `.github/workflows/r006-quality.yml`

## R-007 Backend service decomposition

สถานะ: ✅ DONE

- [x] Large controller/service inventory และ size/ownership thresholds
- [x] Command/query decomposition ตาม critical backend domains
- [x] Mapper, audit writer, serializer และ orchestration separation
- [x] Constructor dependency reduction และ regression coverage

**หลักฐาน:** closure evidence commit `1a2f14dbabf6c615648ed2955c2d6bf67c7aca7f`; audit-writer closure `7633247e`; ownership correction `94e17b8d`

## R-008 Domain model และ policy separation

สถานะ: ✅ DONE

- [x] Promotion/affiliate models และ constraints
- [x] Deposit/withdrawal/wallet/admin/KYC/watchlist/support/notification policies
- [x] Domain errors, value objects และ invariant tests

**หลักฐาน:** `docs/r008-closure-checklist.md`, `docs/evidence/r008-final-verification.md`, `pnpm audit:r8-closure`; closure commit `e9850b22d033edd9f96eba178b1999699a0a5c96`

## R-009 Repository, transaction และ persistence boundary

สถานะ: ✅ DONE

- [x] Prisma access removed from critical controllers
- [x] Repository ports/adapters และ Prisma isolation
- [x] Critical transaction ownership และ lock-order rules
- [x] Transaction-escape, rollback/deadlock/concurrency guards
- [x] PostgreSQL concurrency CI closure

**หลักฐาน:** repository-adapter closure `6df22969`; transaction-escape closure `5a5cde71`; PostgreSQL CI closure `4b0f5066`, `a2b46374`, `9441816e`

## R-010 Query/read model และ projection cleanup

สถานะ: ✅ DONE

- [x] Query inventory, projections, pagination และ filter/sort contracts
- [x] Dashboard/report read models
- [x] Sensitive-field response snapshots/contracts
- [x] EXPLAIN ANALYZE evidence และ query-performance instrumentation

**หลักฐาน:** closure commit `961975c1fc2a9fd9cd658babb5818f19b5e0883f`; performance CI `4e7fbe83`; EXPLAIN evidence workflow `e529067e`

## R-011 Error, authorization และ security boundary

สถานะ: ✅ DONE

- [x] Domain/HTTP error taxonomy และ stable error codes
- [x] Domain/resource authorization และ step-up/reason/audit policies
- [x] Input normalization, sensitive logging redaction และ security audits
- [x] CSRF/replay/idempotency boundaries และ policy tests

**หลักฐาน:** `docs/r011-progress.md`, `docs/evidence/r011-final-verification.md`, `.github/workflows/r011-security-boundaries.yml`; closure commit `203c5ee9b51db85639bfd39f4e8b31ce5d0fe420`

## R-012 Frontend feature architecture และ large-page decomposition

สถานะ: 🟡 IN PROGRESS

- [x] เริ่มแยก page container/presentation ใน critical Member flows
- [ ] ปิด decomposition ของ Admin/Member ทุก feature/domain
- [ ] แยก schemas/defaults/serialization/error mapping และ server/UI state ครบ
- [ ] Component/unit และ optimistic/unsaved-change regression ครบ

## R-013 UI system, design tokens และ accessibility

สถานะ: 🟡 IN PROGRESS

- [x] ลบ unused legacy UI/package files
- [x] เริ่ม shared semantic design tokens และ Admin/Member adoption
- [ ] รวม primitives และ responsive patterns ครบ
- [ ] Keyboard/focus/ARIA/reduced-motion/contrast baseline
- [ ] Six-viewport visual regression และ CI artifacts

## R-014 Observability, documentation และ cleanup

สถานะ: 🔴 TODO เป็นส่วนใหญ่

- [ ] Structured logging และ redaction tests
- [ ] Request/DB/auth/settlement/provider metrics
- [ ] Module README, state-machine docs, ADR และ runbooks
- [ ] Dead-code inventory/removal และ legacy-doc archive

## ลำดับดำเนินงาน P4 ที่ถูกต้อง

1. R-001 ถึง R-011 — ✅ ปิดครบแล้ว
2. ทำ R-012 Frontend feature/page decomposition ต่อ
3. ทำ R-013 shared UI system และ visual/accessibility regression ต่อ
4. ทำ R-014 observability, runbooks, documentation และ cleanup
5. ห้ามย้าย business logic โดยไม่มี regression evidence และห้ามรวม structural refactor หลาย domain ใหญ่ใน commit เดียว

---

# P5 — Performance, storage และ CI

## M-022 Query/pagination

สถานะ: 🟡 PARTIAL — backend architecture/query cleanup ครอบคลุมส่วนสำคัญแล้ว

- [x] Query inventory และ hard-coded `take` audit ตาม R-010 scope
- [x] Shared pagination/projection/filter/sort patterns ตาม R-010 scope
- [x] EXPLAIN ANALYZE และ query-performance instrumentation ตาม R-010 scope
- [ ] Production-scale index evidence และ tuning รอบสุดท้าย

## M-023 Dashboard read model/cache

สถานะ: 🟡 PARTIAL

- [x] Dashboard/report read-model foundation ตาม R-010 scope
- [ ] Production aggregate strategy
- [ ] Cache TTL/invalidation verification

## M-024 Storage security

สถานะ: 🟡 PARTIAL

- [x] Finance/KYC cleanup และ private-storage policies
- [ ] Global file-size limits และ MIME/content validation policy
- [ ] Malware/content scan policy
- [ ] Signed URL policy และ Data URL reduction

## M-025 Lint/typecheck/tests

สถานะ: 🟡 PARTIAL

- [x] Root และ app/package lint/typecheck scripts
- [x] Shared ESLint/format config
- [x] Test taxonomy, failure summary และ browser console/network gate
- [x] Playwright smoke/visual commands
- [ ] Web unit/component coverage ครบทุก critical component
- [ ] Authenticated six-viewport visual artifacts ใน CI

## M-026 CI/config/dependency

สถานะ: 🟡 PARTIAL

- [x] Frozen lockfile, Node 22, pnpm 9 และ PostgreSQL CI
- [x] Prisma validate/generate/migrate
- [x] API/DB tests และทุก app build
- [x] Architecture/lint/typecheck/contract/artifact/failure-summary gates
- [ ] Staging rollback job
- [ ] Env schema/startup validation รอบ production
- [ ] Dependency/security audit และ production secret guard

---

# External blockers

| งาน | Blocker |
|---|---|
| Authenticated Admin/Member regression | ต้องมี seeded test credentials |
| Deployed smoke/cookie/session test | ต้องมี deployed Admin/Member URLs และ credentials |
| Real provider UAT | ต้องมี vendor docs, endpoint, credentials และ whitelist |
| Production migration verification | ต้องมี production access/approved run |
| Binary upload/global storage hardening | ต้องยืนยัน object storage, malware scan และ retention policy |

---

# ลำดับทำงานถัดไป

1. ทำ R-012 Frontend feature/page decomposition ต่อจากงานที่เริ่มแล้ว
2. ทำ R-013 shared components, responsive patterns, accessibility และ six-viewport visual regression
3. เพิ่ม PostgreSQL integration/concurrency evidence สำหรับ watchlist/KYC document lifecycle
4. ทำ Admin KYC UI และ Member KYC upload UI
5. ตั้ง seeded non-production Admin/Member accounts และปิด authenticated regression
6. ปิด production/staging migration, rollback และ deployed session/cookie checks
7. ทำ R-014 observability, documentation, runbooks และ dead-code cleanup
8. ปิด storage/performance/CI P5 ก่อน production launch
9. ทำ provider-specific UAT หลังได้รับ vendor docs/credentials

# Definition of Done ทั้งโปรเจกต์

- [x] CI มี Prisma validate/generate/migrate และ build ทุก app
- [x] Static finance/permission/token/XSS/architecture/API-contract audits มีอยู่
- [x] Latest verified CI และ PostgreSQL critical concurrency suites ผ่านโดยไม่ skip
- [x] P4 Backend R-001 ถึง R-011 ปิดครบพร้อม closure evidence
- [ ] Admin/Member authenticated regression ผ่าน
- [ ] Production/staging migration และ rollback ผ่าน
- [ ] Storage/upload policy ครบ
- [ ] Production-scale query/index evidence ครบ
- [ ] Provider-specific UAT ผ่านก่อนเปิดเงินจริง
- [ ] Deployment health/version ตรง approved commit
- [ ] R-012 ถึง R-014 ปิดครบ

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
