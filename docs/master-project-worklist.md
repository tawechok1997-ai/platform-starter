# Master Project Worklist

เอกสารนี้เป็น source of truth หลักสำหรับสถานะงานของ `platform-starter` บน branch `main`

วันที่จัดโครงสร้างล่าสุด: **2026-07-15**

## หลักการจัดงาน

- P0 ถึง P5 เก็บเฉพาะงานที่สามารถทำต่อใน repository ได้ เช่น implementation, automated tests, CI และ configuration
- P6 เก็บงานที่ต้องใช้ deployed environment, credentials, production access, vendor document หรือ external approval
- งานที่เสร็จแล้วอ้างอิงจาก implementation และ regression evidence ไม่ใช่ checkbox อย่างเดียว
- เอกสาร backlog เก่าถูกยกเลิก ไม่ใช้เป็น source of truth อีกต่อไป

## สถานะรวม

| กลุ่ม | สถานะ |
|---|---|
| P0 Core / schema / finance safety | ✅ DONE ฝั่งโค้ด |
| P1 Security / permissions | ✅ DONE ฝั่งโค้ด |
| P2 Product completion | 🟡 IN PROGRESS |
| P3 Provider foundation | ✅ CODE READY |
| P4 Architecture / UI / observability | 🟡 IN PROGRESS |
| P5 Performance / storage / CI | 🟡 IN PROGRESS |
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

สถานะ: 🟡 IN PROGRESS

## งานที่เสร็จแล้ว

- [x] Member home/game discovery implementation
- [x] Deposit/withdraw guided UI และ workflow status
- [x] Member profile/security/session controls
- [x] Notifications model/list/preferences
- [x] Support/FAQ/ticket lifecycle และ attachment policy
- [x] Admin settings/CMS URL-backed assets
- [x] Reports/activity/risk/security Admin feature set
- [x] Promotion/bonus/affiliate/commission settlement
- [x] CMS/member content implementation
- [x] Bank review และ duplicate-bank detection
- [x] Risk lifecycle และ blacklist/watchlist domain
- [x] KYC case/document lifecycle และ private storage policy
- [x] Phone OTP lifecycle และ PostgreSQL replay/brute-force/concurrency suite
- [x] Admin KYC UI และ Member KYC upload UI

## งานโค้ดที่เหลือ

- [ ] Provider-down/game-launch regression
- [ ] Responsive money-flow duplicate/retry/error regression
- [ ] Notification optimistic rollback regression
- [ ] Actual support binary/object-storage upload
- [ ] Binary asset lifecycle สำหรับ upload จริง
- [ ] PostgreSQL integration/concurrency tests สำหรับ watchlist/KYC document lifecycle

---

# P3 — Provider integration foundation

สถานะ: ✅ CODE READY

- [x] Generic endpoint และ credential contracts
- [x] Safe gates ปิดเงินจริง
- [x] Readiness adapter/registry/template
- [x] Generic signature tests
- [x] Credential lifecycle และ sanitized health checks
- [x] Webhook signature/duplicate handling foundation

> งานที่ต้องใช้ vendor จริงถูกย้ายไป P6 ทั้งหมด

---

# P4 — Professional refactor, UI system และ observability

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

สถานะ: 🟡 IN PROGRESS

- [x] ลบ unused legacy UI/package files
- [x] เริ่ม shared semantic design tokens และ Admin/Member adoption
- [ ] รวม shared UI primitives และ responsive patterns ให้ครบ
- [ ] เพิ่ม keyboard, focus, ARIA, reduced-motion และ contrast baseline
- [ ] เพิ่ม six-viewport visual regression และ CI artifacts

## R-014 Observability และ cleanup

สถานะ: 🟡 IN PROGRESS

- [ ] Structured logging และ redaction tests
- [ ] Request/DB/auth/settlement/provider metrics
- [ ] Dead-code inventory และ removal

---

# P5 — Performance, storage และ CI hardening

สถานะ: 🟡 IN PROGRESS

## Query และ cache

- [x] Query inventory และ hard-coded `take` audit
- [x] Shared pagination/projection/filter/sort patterns
- [x] EXPLAIN ANALYZE และ query-performance instrumentation foundation
- [x] Dashboard/report read-model foundation
- [ ] Implement production aggregate strategy
- [ ] Implement cache TTL และ invalidation contracts

## Storage security

- [x] Finance/KYC cleanup และ private-storage policies
- [ ] Global file-size limits และ MIME/content validation
- [ ] Malware/content scan integration boundary
- [ ] Signed URL policy และ Data URL reduction

## Tests และ CI

- [x] Root และ app/package lint/typecheck scripts
- [x] Shared ESLint/format config
- [x] Test taxonomy และ browser console/network failure gate
- [x] Playwright smoke/visual commands
- [ ] Web unit/component coverage สำหรับ critical components
- [ ] Authenticated visual artifact workflow รองรับ seeded environment
- [ ] Env schema และ startup validation
- [ ] Dependency/security audit และ production secret guard

---

# P6 — External verification, production access และ vendor UAT

สถานะ: ⏸️ BLOCKED / WAITING

รายการใน P6 ไม่ถือเป็นงานโค้ดคงค้าง จนกว่าจะได้รับ environment หรือข้อมูลภายนอกที่จำเป็น

## Credentials และ authenticated regression

- [ ] จัดเตรียม seeded non-production Admin/Member credentials
- [ ] Credentialed end-to-end deposit regression
- [ ] Credentialed end-to-end withdrawal regression
- [ ] Credentialed owner-transfer regression
- [ ] Production account lifecycle regression
- [ ] Read-only role browser regression
- [ ] Mutation control hidden/blocked verification บน route สำคัญ
- [ ] Authenticated six-viewport visual regression
- [ ] Authenticated Support/CMS/Reports regression
- [ ] Authenticated deployed KYC/risk regression

## Deployed environment verification

- [ ] จัดเตรียม deployed Admin/Member URLs
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

# ลำดับทำงานโค้ดถัดไป

1. ปิด R-013 shared UI primitives, responsive และ accessibility
2. เพิ่ม watchlist/KYC PostgreSQL integration และ concurrency tests
3. ทำ support binary/object-storage upload และ binary lifecycle
4. ปิด R-014 structured logging, metrics และ dead-code cleanup
5. ปิด P5 cache, storage security, test coverage และ CI hardening
6. เริ่ม P6 เมื่อ credentials, deployed URLs, production access หรือ vendor docs พร้อม

# จำนวนงานคงค้าง

- งานโค้ดใน P0 ถึง P5: **20 รายการ**
- งาน external verification และ UAT ใน P6: **27 รายการ**
- รวม checkbox ที่ยังไม่ปิด: **47 รายการ**

# เอกสารที่ยกเลิก

ไฟล์ต่อไปนี้ไม่ใช่ source of truth และควรลบหรือ archive แยกจาก master นี้:

- `docs/remaining-work-backlog.md`
- `docs/detailed-remaining-work-backlog.md`
- `docs/code-structure-refactor-plan.md`
- `docs/current-execution-status.md`
- `docs/master-worklist.md`
