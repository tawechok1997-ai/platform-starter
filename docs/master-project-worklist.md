# Master Project Worklist

เอกสารนี้เป็น source of truth หลักสำหรับสถานะงานของ `platform-starter` บน branch `main`

วันที่จัดโครงสร้างล่าสุด: **2026-07-15**

## หลักการจัดงาน

- P0 ถึง P5 เก็บเฉพาะงานที่สามารถทำต่อใน repository ได้ เช่น implementation, automated tests, CI และ configuration
- P6 เก็บงานที่ต้องใช้ deployed environment, credentials, production access, vendor document หรือ external approval
- งานที่เสร็จแล้วต้องมี implementation และ regression evidence ที่เหมาะสม ไม่อ้างอิง checkbox เพียงอย่างเดียว
- ไฟล์นี้เป็น worklist หลักเพียงไฟล์เดียว ไม่ใช้ backlog เก่าเป็น source of truth

## สถานะรวม

| กลุ่ม | สถานะ |
|---|---|
| P0 Core / schema / finance safety | ✅ DONE ฝั่งโค้ด |
| P1 Security / permissions | ✅ DONE ฝั่งโค้ด |
| P2 Product completion | ✅ DONE ฝั่งโค้ด |
| P3 Provider foundation | ✅ DONE ฝั่งโค้ด |
| P4 Architecture / UI / observability | ✅ DONE ฝั่งโค้ด |
| P5 Performance / storage / CI | ✅ DONE ฝั่งโค้ด |
| P6 External verification / production / vendor UAT | ⏸️ BLOCKED / WAITING |

---

# P0 — Core, schema และ financial safety

สถานะ: ✅ DONE ฝั่งโค้ด

- [x] Prisma schema และ migration path
- [x] Prisma validate/generate/migrate deploy ใน CI
- [x] ไม่มี build-time source mutation
- [x] Deposit row lock และ state-transition guard
- [x] Deposit claim-owner checks และ credit idempotency
- [x] Withdrawal row lock และ state-transition guard
- [x] Withdrawal claim-owner checks และ completion idempotency
- [x] Proof duplicate protection
- [x] PostgreSQL finance concurrency suite ผ่านโดยไม่ skip

---

# P1 — Security, permissions และ session safety

สถานะ: ✅ DONE ฝั่งโค้ด

- [x] Last-owner protection และ ownership transfer transaction
- [x] Step-up/2FA confirmation
- [x] Account lifecycle audit และ session revocation
- [x] API/UI permission metadata และ resource authorization policies
- [x] Trusted proxy configuration และ request context
- [x] Account/IP rate limiting และ progressive lockout
- [x] Shared API auth path และ memory access-token policy
- [x] HttpOnly refresh cookies แยก Admin/Member
- [x] CSRF origin check และ token/XSS static audits
- [x] Turnstile/reCAPTCHA/hCaptcha integration foundation
- [x] Encrypted anti-bot secret storage และ adaptive/emergency modes
- [x] Finance reverse/fail/retry guards
- [x] Ledger, idempotency, webhook duplicate และ signature guards
- [x] Real-money safety gates

---

# P2 — Product completion

สถานะ: ✅ DONE ฝั่งโค้ด

- [x] Member home/game discovery implementation
- [x] Deposit/withdraw guided UI และ workflow status
- [x] Member profile/security/session controls
- [x] Notifications model/list/preferences
- [x] Support/FAQ/ticket lifecycle และ attachment metadata policy
- [x] Admin settings/CMS URL-backed assets
- [x] Reports/activity/risk/security Admin feature set
- [x] Promotion/bonus/affiliate/commission settlement
- [x] CMS/member content implementation
- [x] Bank review และ duplicate-bank detection
- [x] Risk lifecycle และ blacklist/watchlist domain
- [x] KYC case/document lifecycle และ private storage policy
- [x] Phone OTP lifecycle และ PostgreSQL replay/brute-force/concurrency suite
- [x] PostgreSQL risk-watchlist และ KYC concurrency suites
- [x] Admin KYC UI และ Member KYC upload UI
- [x] Repository verification command `pnpm verify:p2`

> งาน browser regression ที่ต้องใช้ credentials/deployed environment ย้ายไป P6 และงาน binary/object-storage hardening ใช้ storage contract กลางใน P5 เพื่อไม่สร้างระบบไฟล์ซ้ำ

---

# P3 — Provider integration foundation

สถานะ: ✅ DONE ฝั่งโค้ด

- [x] Generic endpoint และ credential contracts
- [x] Safe gates ปิดเงินจริง
- [x] Readiness adapter/registry/template
- [x] Generic signature tests
- [x] Credential lifecycle และ sanitized health checks
- [x] Webhook signature/duplicate handling foundation
- [x] Provider readiness validation สำหรับ URL, timeout, currency, endpoint และ credential requirements
- [x] Provider readiness unit tests และ repository verification command

> P3 ไม่มีงานโค้ดคงค้างใน repository แล้ว งานที่ต้องใช้ vendor endpoint, credentials, signature/error contract, IP whitelist, callback registration และ provider-specific UAT ถูกย้ายไป P6 ทั้งหมด

---

# P4 — Professional refactor, UI system และ observability

สถานะ: ✅ DONE ฝั่งโค้ด

## R-001 ถึง R-012

สถานะ: ✅ DONE

- [x] Architecture inventory และ ownership
- [x] Dependency rules และ module boundaries
- [x] Regression safety net
- [x] DTO, type strictness และ API contracts
- [x] Shared API client consolidation
- [x] CI quality baseline
- [x] Backend service decomposition
- [x] Domain model และ policy separation
- [x] Repository, transaction และ persistence boundaries
- [x] Query/read model และ projection cleanup
- [x] Error, authorization และ security boundaries
- [x] Frontend feature architecture และ large-page decomposition

## R-013 UI system, design tokens และ accessibility

สถานะ: ✅ DONE

- [x] ลบ unused legacy UI/package files
- [x] Shared semantic design tokens และ Admin/Member adoption
- [x] Shared UI primitives และ responsive patterns
- [x] Keyboard, focus, ARIA, reduced-motion และ contrast baseline
- [x] Six-viewport visual regression และ CI artifacts

**หลักฐาน:** `docs/r013-progress.md`, `docs/evidence/r013-final-verification.md`, workflow `R-013 UI System` และ `R-013 Visual Regression`

## R-014 Observability และ cleanup

สถานะ: ✅ DONE

- [x] Structured logging และ redaction tests
- [x] Request/DB/auth/settlement/provider metrics
- [x] Dead-code inventory และ removal

**หลักฐาน:** `docs/r014-progress.md`, `docs/evidence/r014-dead-code-removal.md`, `docs/evidence/r014-final-documentation-audit.md`

---

# P5 — Performance, storage และ CI hardening

สถานะ: ✅ DONE ฝั่งโค้ด

## Query และ cache

- [x] Query inventory และ hard-coded `take` audit
- [x] Shared pagination/projection/filter/sort patterns
- [x] EXPLAIN ANALYZE และ query-performance instrumentation foundation
- [x] Dashboard/report read-model foundation
- [x] Implement production aggregate strategy
- [x] Implement cache TTL และ invalidation contracts

**หลักฐาน cache:** `packages/api-client/src/index.ts` รองรับ `responseCacheTtlMs`, custom cache key และ `invalidateCache(prefix)` พร้อม cache clear ทั้งชุด

**หลักฐาน aggregate:** Admin dashboard read model ใช้ Redis TTL cache พร้อม bounded in-memory fallback, cache key แยกตามช่วงเวลา, configurable TTL/max entries และ regression tests สำหรับ cache hit, expiry, eviction และ Redis fallback; commits `565c2d0d`, `87f4337c`, `6f46c8ee` ผ่าน deploy

## Storage security

- [x] Finance/KYC cleanup และ private-storage policies
- [x] Actual support binary/object-storage upload ผ่าน storage contract กลาง
- [x] Binary asset lifecycle สำหรับ support upload จริง
- [x] Global file-size limits และ MIME/content validation
- [x] Malware/content scan integration boundary
- [x] Signed URL policy และ Data URL reduction

**หลักฐาน support storage:** `SupportAttachmentsService` รองรับ binary write/read, SHA-256, MIME allowlist, magic-byte validation, compensating deletion และ object cleanup เมื่อ Member/Admin ลบ attachment; commit `54803381` ผ่าน deploy checks ของ API, Admin และ Member

**หลักฐาน storage hardening:** `StorageService.put()` เรียก shared upload policy เพื่อตรวจ size, MIME, magic bytes, plain text และ SVG active content ก่อนเขียน object และเรียก malware scanner boundary แบบ configurable/fail-closed; commits `b0d22773`, `ccc66cb2` และ runtime HTTPS fix `37673f0e` ผ่าน deploy

**หลักฐาน signed access:** support attachment download ใช้ short-lived HMAC-signed token, TTL cap, timing-safe verification, private/no-store response และ authorization ก่อนออก URL; upload รองรับ raw `contentBase64` โดยคง legacy `dataUrl` ชั่วคราว; commits `0f23a7af`, `e27ed338`, `105719d1`, `595cfc47` ผ่าน deploy

## Tests และ CI

- [x] Root และ app/package lint/typecheck scripts
- [x] Shared ESLint/format config
- [x] Test taxonomy และ browser console/network failure gate
- [x] Playwright smoke/visual commands
- [x] Web unit/component coverage สำหรับ critical components
- [x] Authenticated visual artifact workflow รองรับ seeded environment
- [x] Env schema และ startup validation
- [x] Dependency/security audit และ production secret guard

**หลักฐาน web coverage:** Member finance component tests และ Admin security critical-component contract tests มี package-level `test` scripts และ workflow `P5 Web Unit Coverage`; commits `f616ecb0`, `6d30c733`, `77ab2dc0` ผ่าน deploy checks

**หลักฐาน authenticated visual workflow:** Playwright config/spec รองรับ seeded Member/Admin credentials ผ่าน environment, desktop/mobile projects, screenshots, trace, video และ HTML report พร้อม workflow-dispatch artifact retention 14 วัน; commits `9391ab09`, `26d2caae`, `d780e114` การรันด้วย credentials จริงอยู่ใน P6

**หลักฐาน env/startup:** `apps/api/src/common/config/runtime-env.ts` ตรวจ URL, proxy hops, rate limits, production HTTPS, production-required URLs, weak secret placeholders และ storage config ก่อน bootstrap; มี `runtime-env.spec.ts` และรองรับ HTTP เฉพาะ localhost/private/internal production URLs โดยยังบล็อก public HTTP

**หลักฐาน dependency/security:** root commands `audit:dependency-security` และ `audit:production-secrets` ตรวจ production dependencies, private keys, `.env`, certificate/key files และ secret patterns; workflow `P5 Security Audit` รัน lockfile install, dependency audit, secret scan และ env regression โดยใช้สิทธิ์ `contents: read`; commits `ceb80eab`, `bb665c18`, `ccfbab67`

> การรัน authenticated visual workflow ด้วยบัญชีจริง, production workload verification, storage retention approval และ vendor UAT อยู่ใน P6 เพราะต้องใช้ credentials หรือ environment ภายนอก ไม่ใช่งาน implementation คงค้างใน repository

---

# P6 — External verification, production access และ vendor UAT

สถานะ: ⏸️ BLOCKED / WAITING

รายการใน P6 ไม่ถือเป็นงานโค้ดคงค้าง จนกว่าจะได้รับ environment หรือข้อมูลภายนอกที่จำเป็น

## Credentials และ authenticated regression

- [ ] จัดเตรียม seeded non-production Admin/Member credentials
- [ ] Credentialed end-to-end deposit regression
- [ ] Credentialed end-to-end withdrawal regression
- [ ] Responsive money-flow duplicate/retry/error browser regression
- [ ] Notification optimistic rollback browser regression
- [ ] Credentialed owner-transfer regression
- [ ] Production account lifecycle regression
- [ ] Read-only role browser regression
- [ ] Mutation control hidden/blocked verification บน route สำคัญ
- [ ] Authenticated six-viewport visual regression
- [ ] Authenticated Support/CMS/Reports regression
- [ ] Authenticated deployed KYC/risk regression

## Deployed environment verification

- [ ] จัดเตรียม deployed Admin/Member URLs
- [ ] Provider-down/game-launch regression
- [ ] Reverse-proxy integration test
- [ ] Deployed login/refresh/logout/cookie regression
- [ ] Session reuse/rotation regression ผ่าน browser/API จริง
- [ ] Anti-bot failure/fallback regression ใน deployed environment
- [ ] Deployment health/version ตรง approved commit

## Staging และ production verification

- [ ] Staging migration/rollback verification
- [ ] Production migration status ตรง approved commit
- [ ] Production account/provider verification
- [ ] Production-scale index evidence และ tuning รอบสุดท้าย
- [ ] Production aggregate/cache verification ด้วย workload จริง
- [ ] Production storage retention และ malware-scan policy approval

## Vendor/provider UAT

- [ ] Vendor endpoint และ credentials
- [ ] Vendor signature/error contract
- [ ] IP whitelist และ callback requirements
- [ ] Provider reconciliation regression
- [ ] Provider-specific anti-bot production test
- [ ] Provider-specific UAT ก่อนเปิดเงินจริง

---

# ลำดับทำงานถัดไป

1. จัดเตรียม seeded credentials และ deployed URLs สำหรับ P6
2. รัน authenticated/deployed regressions และเก็บ visual artifacts
3. ทำ staging/production verification และ vendor-specific UAT ก่อนเปิดเงินจริง

# จำนวนงานคงค้าง

- งานโค้ดใน P0 ถึง P5: **0 รายการ**
- งาน external verification และ UAT ใน P6: **30 รายการ**
- รวม checkbox ที่ยังไม่ปิด: **30 รายการ**
