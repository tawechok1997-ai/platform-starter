# Master Project Worklist

เอกสารนี้เป็น source of truth หลักสำหรับสถานะงานของ `platform-starter` โดยอ้างอิงจาก source code, scripts, tests, workflow และไฟล์ configuration ที่อยู่บน branch `main`

วันที่ตรวจล่าสุด: **2026-07-15**  
Branch อ้างอิง: **`main`**

## หลักการให้สถานะ

- ✅ DONE — มี implementation ใน repo และมี automated evidence ที่เหมาะสม
- 🟡 PARTIAL — มี implementation แล้ว แต่ยังขาด test, browser regression, production verification หรือส่วนประกอบสำคัญ
- 🔴 TODO — ยังไม่พบ implementation ที่ยืนยันได้ใน repo
- ⏸️ BLOCKED — ทำต่อไม่ได้โดยไม่มี credential, deployed URL, vendor document หรือ external decision

> การมีหน้า UI, route, script หรือ test file เพียงอย่างเดียวไม่ถือว่า DONE จนกว่าจะมีหลักฐานว่าพฤติกรรมสำคัญถูกตรวจจริง

## หลักฐานที่ตรวจพบใน repo

- Root scripts มี build, test, lint, Prisma, permission audit, finance audit, token/XSS audit, Playwright smoke และ visual commands
- `apps/api` มี Jest, finance concurrency, promotion settlement concurrency และ phone OTP PostgreSQL security test commands
- `apps/web-admin` และ `apps/web-member` มี build script แต่ยังไม่มี app-level lint/test script
- Build workflow ใช้ PostgreSQL 16, รัน Prisma validate/generate/migrate, API tests, finance concurrency tests, promotion settlement concurrency tests, phone OTP security tests และ build ทั้งสามแอป
- Build #618 ผ่านครบทั้ง API tests, PostgreSQL finance concurrency, PostgreSQL promotion settlement concurrency และ buildทั้งสามแอป
- Phone OTP CI รอบล่าสุดผ่านทั้ง API tests, PostgreSQL replay/brute-force/concurrent verify suite และ build ทั้งสามแอป
- มี shared package `packages/api-client`
- Playwright smoke/visual config มีอยู่ แต่ผล browser regression ไม่ถือว่าผ่านจนกว่าจะมี workflow หรือ artifact ยืนยัน

---

# ภาพรวมสถานะจริง

| กลุ่ม | สถานะ |
|---|---|
| Monorepo / API / Admin / Member foundation | ✅ DONE |
| Prisma schema และ CI migration path | ✅ DONE ใน CI; production rollback/verification ยังไม่ครบ |
| Deposit / withdrawal workflow safety | 🟡 PARTIAL — DB concurrency ผ่านแล้ว เหลือ credentialed production flow |
| Admin auth / owner / role / 2FA | 🟡 PARTIAL — implementation มีแล้ว เหลือ credentialed regression |
| Permission coverage | 🟡 PARTIAL — static audits มีแล้ว เหลือ role-based browser regression |
| Member home / game discovery | 🟡 PARTIAL — feature หลักมีแล้ว เหลือ authenticated visual regression |
| Member profile / security | 🟡 PARTIAL |
| Notifications | 🟡 PARTIAL — channel model/UI มีแล้ว เหลือ rollback/browser regression |
| Support / FAQ | 🟡 PARTIAL — attachment backend policy มีแล้ว เหลือ binary upload และ browser regression |
| Admin settings / CMS | 🟡 PARTIAL — URL-backed assets เท่านั้น และยังขาด browser regression |
| Reports / Activity / Risk / Security Admin | 🟡 PARTIAL — feature หลักมีแล้ว แต่ยังขาด authenticated regression |
| Promotion / Bonus / Affiliate / Commission | ✅ DONE — ยังห้ามเปิดเงินจริงจนกว่า provider-specific UAT ผ่าน |
| KYC / Blacklist / Document workflow | 🟡 PARTIAL — blacklist/watchlist, KYC document backend และ Phone OTP มีแล้ว เหลือ UI, watchlist/KYC DB evidence และ deployed regression |
| Real provider integration | ⏸️ Code readiness มีแล้ว; vendor UAT blocked |
| Code structure refactor | 🟡 PARTIAL — ขยายเป็น execution-ready backlog ใน P4 |
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
- [x] ยืนยัน finance DB suite บน commit ล่าสุดว่า run จริงและไม่ skip
- [ ] Credentialed end-to-end deposit regression

## M-003 Withdrawal workflow

สถานะ: 🟡 PARTIAL

- [x] Row lock และ state-transition guard
- [x] Claim-owner checks
- [x] Proof duplicate protection
- [x] Completion idempotency
- [x] Legacy direct-complete endpoint ถูกถอดออก
- [x] Finance concurrency test coverage มีอยู่
- [x] ยืนยัน finance DB suite บน commit ล่าสุดว่า run จริงและไม่ skip
- [ ] Credentialed end-to-end withdrawal regression

## M-004 Build-time source mutation

สถานะ: ✅ DONE

- [x] `build:api` ใช้ Prisma generate และ Nest build โดยตรง
- [x] ไม่มี `db:fix-schema` ใน `db:generate`
- [x] ไม่มี `fix:api-workflows` ใน `build:api`

> P0 จะถือว่าปิดทั้งหมดได้เมื่อ staging migration และ credentialed money-flow regression มีหลักฐานครบ

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
- [x] DB concurrency run evidence บน commit ล่าสุด
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
- [x] Email/SMS/push channel model และ UI
- [ ] Optimistic update rollback regression

## M-015 Support/FAQ

สถานะ: 🟡 PARTIAL

- [x] FAQ search/category
- [x] Ticket pagination/filter/search
- [x] Draft/preview/timeline
- [x] Close/reopen/polling fallback
- [x] Money/provider reference linking
- [x] Attachment model/storage-key/MIME/size policy
- [ ] Actual binary/object storage upload integration
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

สถานะ: ✅ DONE — **ยังห้ามเปิดเงินจริงจนกว่า provider-specific UAT ผ่าน**

- [x] Campaign/claim/review flow
- [x] Turnover tracking logic
- [x] Referral/downline/commission calculation
- [x] Payout disabled guard
- [x] แยก domain model ออกจาก `RiskAlert.metadata`
- [x] Wallet settlement path
- [x] Concurrency/idempotency/settlement tests ผ่าน PostgreSQL จริง

## M-019 CMS/member content

สถานะ: 🟡 PARTIAL

- [x] Banner/announcement/popup/maintenance content
- [x] Category ordering และ featured content
- [x] Broken URL validation
- [ ] Visual regression ทุก viewport
- [ ] Binary asset lifecycle ถ้าจะรองรับ upload จริง

## M-020 KYC/risk

สถานะ: 🟡 PARTIAL

- [x] Bank review และ duplicate-bank detection
- [x] Risk status lifecycle
- [x] Blacklist/watchlist model และ reason taxonomy
- [x] HMAC matching, duplicate protection, release lifecycle และ audit
- [x] Enforcement ใน registration/profile/bank/withdrawal พร้อม override audit
- [x] KYC case/document model และ review lifecycle
- [x] KYC document upload, private storage, MIME/size policy และ SHA-256 metadata
- [x] KYC retention cleanup และ short-lived document access token policy
- [x] Unit/regression tests สำหรับ watchlist enforcement และ KYC document lifecycle
- [x] Phone OTP/SMS verification lifecycle, hash, expiry, attempt limit, rate limit และ provider abstraction
- [x] PostgreSQL phone OTP replay/brute-force/concurrent verify tests ผ่านจริง
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

> P4 เป็น execution backlog จริง ไม่ใช่หัวข้อกว้าง ๆ อีกต่อไป งานกลุ่ม **P4-A Safety Refactor** ให้ทำแทรกระหว่าง feature ได้ทันที ส่วน **P4-B Structural Refactor** ให้ทำเมื่อ regression coverage ของ domain นั้นพร้อมแล้ว

## P4 Definition of Done

- [ ] ไม่มี controller เรียก Prisma โดยตรง
- [ ] ไม่มี circular dependency ระหว่าง module สำคัญ
- [ ] ทุก critical mutation มี DTO, authorization policy, transaction boundary และ audit
- [ ] Critical path ไม่มี unsafe `any`, double cast หรือ non-null assertion โดยไม่มี guard
- [ ] Frontend ใช้ API client กลางเพียงชุดเดียว
- [ ] Module ownership และ public contract ถูกบันทึกครบ
- [ ] Critical flow มี unit/integration/contract/browser regression ตามความเหมาะสม
- [ ] CI มี architecture, lint, typecheck และ forbidden-import guard
- [ ] Large page และ service ที่เกินเกณฑ์ถูกแยกเป็นส่วนที่ทดสอบได้
- [ ] เอกสาร architecture, ADR และ module README ตรงกับ implementation ล่าสุด

## P4-A — Safety Refactor ทำได้ทันที

### R-001 Architecture inventory และ ownership

สถานะ: ✅ DONE

- [x] Endpoint ownership matrix
- [x] Migration/deprecation plan
- [x] สร้าง `docs/architecture/module-map.md`
- [x] สร้าง `docs/architecture/dependency-map.md`
- [x] สร้าง `docs/architecture/route-ownership.md`
- [x] ระบุ owner ของทุก controller, route, cron และ background job
- [x] ระบุ database tables, side effects, permission และ audit event ของทุก critical route
- [x] ระบุ service ที่ถูกเรียกข้าม module พร้อมเหตุผล
- [x] ตรวจ circular dependency ระหว่าง Nest modules
- [x] ตรวจ deep import ข้าม module
- [x] กำหนด public entry point ของแต่ละ module
- [x] เพิ่ม architecture inventory check ใน CI

**หลักฐานปิดงาน:** `docs/architecture/r001-closure.md`, `pnpm audit:r1-closure`, architecture inventory/boundary gates ใน CI

### R-002 Dependency rules และ module boundaries

สถานะ: ✅ DONE

- [x] กำหนด dependency direction: presentation → application → domain
- [x] แยก infrastructure adapter ออกจาก domain rule ด้วย boundary policy
- [x] ห้าม domain import NestJS, Prisma หรือ HTTP exception
- [x] ห้าม frontend import server-only package
- [x] ห้าม app import source ภายในของอีก app
- [x] เพิ่ม ESLint/import boundary rules และ static architecture enforcement
- [x] เพิ่ม forbidden-import script
- [x] เพิ่ม circular dependency scan
- [x] เพิ่ม CI gate สำหรับ architecture violation
- [x] บันทึกข้อยกเว้นชั่วคราวพร้อม owner และวันหมดอายุใน `boundary-exceptions.md`

**หลักฐานปิดงาน:** `docs/architecture/r002-closure.md`, `pnpm audit:r2-closure`, ไม่มี undocumented/expired exception

### R-003 Regression safety net ก่อนย้ายโค้ด

สถานะ: ✅ DONE

- [x] ทำ test inventory แยก unit/integration/contract/database/browser/visual/concurrency
- [x] ระบุ critical flows ที่ยังไม่มี regression test
- [x] เพิ่ม characterization tests ให้ service ที่กำลังจะแยก
- [x] เพิ่ม state-transition tests สำหรับ deposit/withdrawal/KYC/watchlist/support/admin lifecycle
- [x] เพิ่ม permission policy tests สำหรับ critical mutations
- [x] เพิ่ม error-contract snapshots/guards
- [x] เพิ่ม database rollback tests สำหรับ transaction สำคัญตาม repository-level coverage
- [x] เพิ่ม test ป้องกัน duplicate settlement/idempotency regression
- [x] ห้าม refactor domain ใดหาก critical behavior ของ domain นั้นยังไม่มี test
- [x] เพิ่ม test failure summary ใน CI

**หลักฐานปิดงาน:** `docs/architecture/r003-closure.md`, `pnpm audit:r3-closure`, critical database/test-skip guards ใน CI

### R-004 DTO, type strictness และ API contract

สถานะ: 🟡 PARTIAL

- [x] Shared `AdminActor`/`MemberActor`
- [ ] ทำ inventory mutation routes ทั้งหมด
- [ ] เพิ่ม DTO ครบทุก `POST`, `PUT`, `PATCH` และ `DELETE` ที่มี body
- [ ] เพิ่ม validation, normalization, enum whitelist และ max length
- [ ] แยก request DTO, command type, domain type และ response DTO
- [ ] ห้ามส่ง Prisma model ออก API โดยตรง
- [ ] ทำ sensitive-field denylist สำหรับ response
- [ ] ลด `any`, `as unknown as` และ non-null assertion ใน critical path
- [ ] เปิดหรือทยอยเปิด `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- [ ] เพิ่ม error code catalog ที่ frontend ใช้ได้โดยไม่ parse message
- [ ] เพิ่ม contract tests ระหว่าง API กับ Admin/Member
- [ ] เพิ่ม strict/type regression guard ใน CI

**หลักฐานปิดงาน:** critical mutations typed end-to-end และ generated/declared contract ตรงกัน

### R-005 Shared API client consolidation

สถานะ: 🟡 PARTIAL

- [x] `packages/api-client`
- [x] Shared URL/header/error/retry/cache/auth-refresh behavior
- [x] Admin/member workspace integration
- [x] Auth flow migration บางส่วน
- [ ] inventory `fetch`, `axios`, local `/api/*`, `adminFetch`, `memberFetch`, `fetchJson` และ helper ซ้ำทั้งหมด
- [ ] ย้าย Admin routes ทุก route ไป API client กลาง
- [ ] ย้าย Member routes ทุก route ไป API client กลาง
- [ ] ทำ typed request/response per domain
- [ ] รวม timeout, abort, retry และ request ID behavior
- [ ] รวม auth refresh/rotation behavior
- [ ] รองรับ file upload และ private download แบบ typed
- [ ] ทำ error normalization กลาง
- [ ] ลบ duplicate API helpers
- [ ] เพิ่ม static audit ป้องกัน helper ใหม่ที่ไม่ผ่าน client กลาง
- [ ] เพิ่ม contract regression สำหรับ auth, finance, KYC, support และ notifications

**หลักฐานปิดงาน:** ไม่มี direct/local API call นอก allowlist และ helper ซ้ำเป็นศูนย์

### R-006 CI quality baseline

สถานะ: ✅ DONE

- [x] เพิ่ม `lint:api`, `lint:admin`, `lint:member`, `lint:packages`
- [x] เพิ่ม `typecheck:api`, `typecheck:admin`, `typecheck:member`, `typecheck:packages`
- [x] เพิ่ม shared ESLint config
- [x] เพิ่ม shared formatter config
- [x] เพิ่ม unused import/export checks
- [x] เพิ่ม forbidden import และ circular dependency checks
- [x] เพิ่ม generated-client/schema drift check
- [x] เพิ่ม migration validation gate
- [x] เพิ่ม test-skip detection สำหรับ critical suites
- [x] เพิ่ม browser console/network error failure gate
- [x] เพิ่ม artifact/failure summary
- [x] ทำ changed-files optimization โดยไม่ตัด critical dependency tests

**หลักฐานปิดงาน:** `docs/architecture/r006-closure.md`, `pnpm audit:r6-closure`, `.github/workflows/r006-quality.yml`

### R-007 Backend service decomposition

สถานะ: 🔴 TODO

- [ ] inventory controller/service ที่เกินเกณฑ์บรรทัดหรือจำนวน dependency
- [ ] กำหนดเกณฑ์ controller/service size และ public method count
- [ ] แยก command กับ query สำหรับ finance
- [ ] แยก command กับ query สำหรับ admin lifecycle/auth
- [ ] แยก command กับ query สำหรับ KYC/watchlist
- [ ] แยก command กับ query สำหรับ support/notifications
- [ ] แยก command กับ query สำหรับ CMS/reports
- [ ] แยก mapper Prisma ↔ domain ↔ response
- [ ] แยก audit builder และ metadata formatter
- [ ] แยก CSV/report serializer
- [ ] แยก provider orchestration
- [ ] แยก settlement orchestration
- [ ] ลด constructor dependencies ที่มากเกินเกณฑ์
- [ ] ทำ regression tests ต่อ handler/service ใหม่

**หลักฐานปิดงาน:** service ใหญ่ถูกแยกตาม responsibility และทุกส่วนทดสอบแยกได้

### R-008 Domain model และ policy separation

สถานะ: ✅ DONE

- [x] Promotion/bonus models แยกจาก `RiskAlert.metadata`
- [x] Affiliate/commission models
- [x] Constraints/indexes/backfill
- [x] Service/frontend migration ของ promotion domain
- [x] แยก Deposit entity/state transition policy
- [x] แยก Withdrawal entity/state transition policy
- [x] แยก Wallet settlement policy
- [x] แยก Admin account/ownership policy
- [x] แยก KYC review policy
- [x] แยก Watchlist matching/override policy
- [x] แยก Support ticket lifecycle policy
- [x] แยก Notification preference policy
- [x] ทำ domain errors ที่ไม่ผูกกับ Nest HTTP exception
- [x] ทำ value objects สำหรับ Money, Phone, BankAccount และ identifiers ที่สำคัญ
- [x] เพิ่ม unit tests สำหรับ invariant และ policy ทุก domain สำคัญ

**หลักฐานปิดงาน:** `docs/r008-closure-checklist.md`, `docs/evidence/r008-final-verification.md`, `pnpm audit:r8-closure`, API typecheck, full API tests และ API build ผ่าน; closure commit `e9850b22d033edd9f96eba178b1999699a0a5c96`

### R-009 Repository, transaction และ persistence boundary

สถานะ: 🔴 TODO

- [ ] ตรวจ controller ที่เรียก Prisma โดยตรงทั้งหมด
- [ ] ย้าย Prisma access ออกจาก controller
- [ ] กำหนด repository ports สำหรับ critical domains
- [ ] ทำ Prisma repository adapters
- [ ] ห้าม Prisma type หลุดผ่าน repository interface
- [ ] รวม transaction boundary ของ deposit approval
- [ ] รวม transaction boundary ของ withdrawal completion
- [ ] รวม transaction boundary ของ ownership transfer
- [ ] รวม transaction boundary ของ KYC review/watchlist override
- [ ] รวม transaction boundary ของ promotion settlement
- [ ] กำหนด lock order มาตรฐานเพื่อลด deadlock
- [ ] ทำ row-lock helpers ที่สื่อ intent
- [ ] ตรวจ query ที่หลุดออกนอก transaction
- [ ] เพิ่ม rollback/deadlock/concurrency tests
- [ ] audit unique/foreign-key/cascade/idempotency constraints

**หลักฐานปิดงาน:** critical write flow มี transaction owner เดียว, lock order ชัด และ rollback test ผ่าน

### R-010 Query/read model และ projection cleanup

สถานะ: 🔴 TODO

- [ ] inventory query ซ้ำและ hard-coded `take`
- [ ] รวม query ซ้ำตาม module ownership
- [ ] แยก list/detail/summary projections
- [ ] ลด `include` relation ที่ไม่จำเป็นใน list endpoint
- [ ] ทำ cursor pagination pattern กลาง
- [ ] ทำ filter parser และ sort whitelist กลาง
- [ ] ป้องกัน arbitrary sort/filter
- [ ] ทำ dashboard read model
- [ ] ทำ report read model
- [ ] ตรวจ sensitive fields ใน projection
- [ ] เพิ่ม response snapshot/contract tests
- [ ] เพิ่ม EXPLAIN ANALYZE evidence สำหรับ query หนัก
- [ ] เพิ่ม N+1/slow-query metrics

**หลักฐานปิดงาน:** list endpoints โหลดเฉพาะ field จำเป็น, pagination มาตรฐานเดียว และ query หนักมี evidence

### R-011 Error, authorization และ security boundary

สถานะ: ✅ DONE

- [x] สร้าง domain error taxonomy
- [x] แยก domain error จาก HTTP exception
- [x] ทำ HTTP error mapper กลาง
- [x] ทำ stable error codes และ localization-ready message keys
- [x] รวม authorization policies ต่อ domain
- [x] เพิ่ม resource-level authorization
- [x] รวม step-up/2FA requirement checks
- [x] รวม mandatory reason/audit checks
- [x] แยก DTO validation, business validation และ persistence constraint
- [x] ทำ input normalization สำหรับ email/phone/bank account/Unicode
- [x] ทำ sensitive logging redact policy
- [x] เพิ่ม static audit ป้องกัน log token/password/OTP/secret/private URL
- [x] ตรวจ CSRF/replay/idempotency boundaries
- [x] เพิ่ม security policy tests

**หลักฐานปิดงาน:** `docs/r011-progress.md`, `docs/evidence/r011-final-verification.md`, `.github/workflows/r011-security-boundaries.yml`, domain authorization registry/audit, security policy tests, API typecheck และ Railway API/Admin/Member deployment checks ผ่าน; closure evidence commit `203c5ee9b51db85639bfd39f4e8b31ce5d0fe420`

### R-012 Frontend feature architecture และ large-page decomposition

สถานะ: 🔴 TODO

- [ ] จัด Admin folders ตาม feature/domain
- [ ] จัด Member folders ตาม feature/domain
- [ ] กำหนด public exports ของแต่ละ feature
- [ ] แยก page container ออกจาก presentation components
- [ ] แยก register page
- [ ] แยก deposit page
- [ ] แยก withdrawal page
- [ ] แยก provider page
- [ ] แยก content/CMS page
- [ ] แยก promotion page
- [ ] แยก security/admin lifecycle page
- [ ] แยก KYC admin/member pages
- [ ] แยก support page/thread components
- [ ] แยก form schemas/defaults/serialization/error mapping
- [ ] แยก server state จาก UI state
- [ ] ทำ query-key factories และ invalidation rules
- [ ] เพิ่ม component/unit tests สำหรับส่วนที่แยก
- [ ] เพิ่ม unsaved-change และ optimistic rollback regression

**หลักฐานปิดงาน:** page files ไม่แบก business logic และ component สำคัญทดสอบแยกได้

### R-013 UI system, design tokens และ accessibility

สถานะ: 🟡 PARTIAL

- [x] ลบ unused legacy admin UI files
- [x] ลบ empty unused `packages/ui`
- [ ] inventory hard-coded color/spacing/radius/shadow/breakpoint/z-index
- [ ] รวม color tokens
- [ ] รวม spacing/radius/shadow tokens
- [ ] รวม typography/motion/breakpoint/z-index tokens
- [ ] สร้างหรือรวม Button/Input/Select/TextArea primitives
- [ ] สร้างหรือรวม Modal/Drawer/ConfirmDialog primitives
- [ ] สร้างหรือรวม Table/Pagination/Tabs/Badge primitives
- [ ] สร้างหรือรวม Toast/Alert/Skeleton/EmptyState/ErrorState primitives
- [ ] ลด responsive CSS ซ้ำ
- [ ] กำหนด mobile-first responsive strategy
- [ ] กำหนด table→card, modal→bottom-sheet และ sidebar→drawer patterns
- [ ] เพิ่ม keyboard/focus/ARIA baseline
- [ ] เพิ่ม reduced-motion และ contrast checks
- [ ] เพิ่ม six-viewport visual regression
- [ ] เก็บ screenshot/trace/console/network artifacts ใน CI

**หลักฐานปิดงาน:** design system ใช้จริงทั้ง Admin/Member และ visual/accessibility regressions ผ่าน

### R-014 Observability, documentation และ cleanup

สถานะ: 🔴 TODO

- [ ] ทำ structured logging fields: requestId, actorId, actorType, module, action, duration, result
- [ ] ทำ log redaction tests
- [ ] เพิ่ม request latency/error-rate/DB-query metrics
- [ ] เพิ่ม login/settlement/provider callback failure metrics
- [ ] ทำ slow-query dashboard หรือ report
- [ ] เขียน module README สำหรับ finance/auth/KYC/watchlist/support/notifications/CMS
- [ ] เขียน state-machine docs สำหรับ deposit/withdrawal/KYC/support/admin lifecycle/promotion
- [ ] เพิ่ม ADR สำหรับ module boundaries, transaction, API client, session, storage, audit, cache
- [ ] เพิ่ม deployment/migration/rollback runbooks
- [ ] เพิ่ม finance/security/provider outage runbooks
- [ ] inventory unused exports/components/routes/feature flags/helpers/CSS
- [ ] ลบ dead code ทีละ domain พร้อม regression evidence
- [ ] archive legacy docs หลังเชื่อมกลับมาที่ master
- [ ] ตรวจเอกสารกับ implementation รอบสุดท้าย

**หลักฐานปิดงาน:** ทีมใหม่สามารถเข้าใจ module, deploy, rollback และแก้ incident ได้จาก repo โดยไม่ต้องเดา

## ลำดับดำเนินงาน P4

1. R-001 Architecture inventory
2. R-003 Regression safety net
3. R-004 DTO/type/API contract
4. R-005 Shared API client
5. R-006 CI quality baseline
6. R-002 Dependency rules และ boundary enforcement
7. R-007 ถึง R-011 ทำทีละ backend domain: finance → auth/admin → KYC/watchlist → support/notifications → CMS/reports
8. R-012 Frontend feature/page decomposition ตาม domain ที่ backend contract นิ่งแล้ว
9. R-013 UI system และ visual/accessibility regression
10. R-014 Observability, docs และ dead-code cleanup

> ห้ามทำ structural refactor หลาย domain ใหญ่ใน commit เดียว และห้ามย้าย business logic โดยไม่มี regression test ก่อนหน้า

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
- [x] ยืนยัน latest main workflow result และ finance DB test ไม่ skip
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
| Support attachment binary upload และ global storage hardening | ต้องยืนยัน object-storage, malware scan และ global retention policy |

---

# ลำดับทำงานถัดไป

1. เริ่ม P4-A R-001 Architecture inventory และ R-003 Regression safety net ควบคู่กับงาน feature
2. เพิ่ม PostgreSQL integration/concurrency tests สำหรับ watchlist/KYC document lifecycle
3. ทำ Admin KYC UI และ Member KYC upload UI
4. ทำ authenticated deployed KYC/risk regression
5. ตั้ง seeded non-production Admin/Member accounts สำหรับ browser tests
6. ปิด M-005 ถึง M-010 ด้วย credentialed regression
7. ปิด M-011 ถึง M-017 และ M-019 ด้วย authenticated visual/functional regression
8. ทำ P4-B structural refactor ทีละ domain หลัง regression coverage พร้อม
9. ปิด performance/storage/CI P5 ก่อน production launch
10. ทำ provider-specific UAT หลังได้รับ vendor docs/credentials

# Definition of Done ทั้งโปรเจกต์

- [x] CI มี Prisma validate/generate/migrate และ build ทุก app
- [x] Static finance/permission/token/XSS audit commands มีอยู่
- [x] Latest main CI ผ่านและเก็บหลักฐานครบ
- [x] Finance concurrency tests ผ่าน PostgreSQL จริงโดยไม่ skip
- [ ] Admin/Member authenticated regression ผ่าน
- [ ] Production/staging migration และ rollback ผ่าน
- [ ] ไม่มี financial settlement path ที่ขาด idempotency/concurrency/audit
- [ ] ไม่มี critical route ที่ขาด permission regression
- [ ] Storage/upload policy ครบ
- [ ] Query หนักมี pagination/index evidence
- [ ] Provider-specific UAT ผ่านก่อนเปิดเงินจริง
- [ ] Deployment health/version ตรง commit ที่อนุมัติ
- [ ] P4 Professional Refactor Definition of Done ผ่านครบ

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
