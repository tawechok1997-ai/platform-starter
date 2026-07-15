# Full-System Test Checklist

เอกสารนี้เป็นรายการทดสอบระบบ `platform-starter` แบบครบวงจร ตั้งแต่ repository, database, API, Web Admin, Web Member, ระบบการเงิน, provider, security ไปจนถึง production verification

ใช้คู่กับ `docs/master-project-worklist.md` และ `docs/p6-execution-runbook.md` โดยไฟล์นี้เป็น **test execution checklist** ไม่ใช่รายการพัฒนาฟีเจอร์

## สัญลักษณ์

- `[AUTO]` รันอัตโนมัติใน local/CI ได้
- `[MANUAL]` ต้องตรวจด้วยผู้ทดสอบ
- `[STAGING]` ต้องใช้ staging หรือระบบที่ deploy แล้ว
- `[PROD]` ตรวจใน production แบบไม่ทำลายข้อมูล
- `[VENDOR]` ต้องใช้ข้อมูลหรือระบบของ provider จริง
- `[DESTRUCTIVE]` เปลี่ยนแปลงข้อมูล ต้องใช้ฐานข้อมูล/บัญชีทดสอบเท่านั้น

## ข้อมูลรอบทดสอบ

- [ ] Commit SHA ที่ทดสอบ: `____________________________`
- [ ] Environment: `local / CI / staging / production`
- [ ] API URL: `____________________________`
- [ ] Admin URL: `____________________________`
- [ ] Member URL: `____________________________`
- [ ] Database migration ล่าสุด: `____________________________`
- [ ] ผู้ทดสอบ: `____________________________`
- [ ] วันที่และเวลา: `____________________________`
- [ ] Test run / GitHub Actions URL: `____________________________`
- [ ] Evidence folder / artifact URL: `____________________________`

## ชุดคำสั่งแนะนำ

### รอบที่ 1 — Repository gate

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm audit:migration-validation
pnpm audit:dependency-security
pnpm format:check
pnpm lint
pnpm typecheck
```

### รอบที่ 2 — Unit, integration และ build

```bash
pnpm test
pnpm build
pnpm test:e2e:smoke
```

### รอบที่ 3 — PostgreSQL concurrency บนฐานข้อมูลทดสอบ

```bash
pnpm --filter @platform/api test:db:finance
pnpm --filter @platform/api test:db:promotions
pnpm --filter @platform/api test:db:phone-otp
pnpm --filter @platform/api test:db:risk-watchlist
pnpm --filter @platform/api test:db:kyc
```

### รอบที่ 4 — Repository verification

```bash
pnpm verify:p1:production
pnpm verify:p2
pnpm verify:p3
```

### รอบที่ 5 — Deployed/P6

1. ตั้ง GitHub secrets ตาม `docs/p6-execution-runbook.md`
2. รัน workflow `P6 Authenticated Deployed Regression`
3. เก็บ screenshot, trace, video, HTML report, logs และ commit/version evidence
4. ทำ checklist หมวด staging, production และ vendor ด้านล่าง

---

# 1. Test Safety และ Entry Criteria

## 1.1 Environment isolation

- [ ] [STAGING] ใช้ฐานข้อมูล staging แยกจาก production
- [ ] [STAGING] ใช้ bucket/object storage สำหรับทดสอบแยกจาก production
- [ ] [STAGING] ใช้ Redis namespace หรือ instance แยกจาก production
- [ ] [STAGING] ใช้ provider sandbox หรือโหมด dry-run
- [ ] [MANUAL] ยืนยันว่า real-money feature flag ยังปิดอยู่
- [ ] [MANUAL] ไม่มีข้อมูลลูกค้าจริงใน automated test fixtures
- [ ] [MANUAL] ไม่มี Owner account จริงใน automated browser test
- [ ] [MANUAL] กำหนดผู้อนุมัติและ rollback owner ก่อนเริ่มทดสอบ destructive flow

## 1.2 Test identities

- [ ] มีบัญชี Member สถานะ ACTIVE
- [ ] มีบัญชี Member สถานะ SUSPENDED
- [ ] มีบัญชี Member สถานะ BANNED หรือถูก risk block
- [ ] มีบัญชี Admin Owner พร้อม 2FA
- [ ] มีบัญชี Admin สิทธิ์เต็มแต่ไม่ใช่ Owner
- [ ] มีบัญชี Admin read-only
- [ ] มีบัญชี Admin สิทธิ์เฉพาะ finance
- [ ] มีบัญชี Admin สิทธิ์เฉพาะ KYC/risk
- [ ] มีบัญชี Admin ที่ถูก LOCKED หรือ INACTIVE
- [ ] Test credentials สามารถ reset ได้หลังจบรอบทดสอบ

## 1.3 Seeded test data

- [ ] มี wallet ยอดเงินเพียงพอสำหรับ deposit/withdraw scenarios
- [ ] มีบัญชีธนาคาร Member ที่ approved, pending และ disabled
- [ ] มีบัญชีรับฝาก Admin ที่ active และ inactive
- [ ] มี top-up/withdrawal ครบทุกสถานะ
- [ ] มี promotion ทั้ง eligible, ineligible, expired และ disabled
- [ ] มี KYC case และ risk alert ครบสถานะสำคัญ
- [ ] มี support ticket ทั้ง open, reviewing, resolved และ reopened
- [ ] มี demo provider/game/session/transfer/webhook fixtures
- [ ] มีข้อมูลข้อความไทยยาว, UUID ยาว, ค่าว่าง และข้อมูลจำนวนมากสำหรับ layout/performance

---

# 2. Repository, Install และ Static Quality

## 2.1 Dependency installation

- [ ] [AUTO] `pnpm install --frozen-lockfile` ผ่าน
- [ ] [AUTO] lockfile ตรงกับ workspace manifests
- [ ] [AUTO] ไม่มี package install script ที่ไม่ได้อนุญาต
- [ ] [AUTO] `pnpm audit --prod` ไม่พบ vulnerability ตามระดับที่กำหนด
- [ ] [AUTO] `pnpm audit:production-secrets` ผ่าน
- [ ] [AUTO] ไม่มี `.env`, private key, certificate หรือ credentials ถูก commit

## 2.2 Static gates

- [ ] [AUTO] `pnpm format:check` ผ่าน
- [ ] [AUTO] `pnpm lint` ผ่านทุก workspace
- [ ] [AUTO] `pnpm typecheck` ผ่านทุก workspace
- [ ] [AUTO] `git diff --check` ผ่าน
- [ ] [AUTO] Prisma client generate ผ่าน
- [ ] [AUTO] Prisma schema validate ผ่าน
- [ ] [AUTO] migration validation audit ผ่าน
- [ ] [AUTO] architecture/boundary audits ที่อยู่ใน CI ผ่าน
- [ ] [AUTO] ไม่มี circular dependency หรือ generated drift ที่ gate ห้ามไว้

## 2.3 Build

- [ ] [AUTO] API production build ผ่าน
- [ ] [AUTO] Web Admin production build ผ่าน
- [ ] [AUTO] Web Member production build ผ่าน
- [ ] [AUTO] API client package build ผ่าน
- [ ] [AUTO] build ไม่แก้ source file โดยไม่ตั้งใจ
- [ ] [AUTO] build output ไม่มี secret หรือ internal credential
- [ ] [AUTO] Next.js route generation ไม่มี error/warning ที่กระทบ runtime

## 2.4 Automated tests

- [ ] [AUTO] API unit/integration test ทั้งหมดผ่าน
- [ ] [AUTO] Security regression tests ผ่าน
- [ ] [AUTO] API client tests ผ่าน
- [ ] [AUTO] Web Admin unit/component tests ผ่าน
- [ ] [AUTO] Web Member unit/component tests ผ่าน
- [ ] [AUTO] PostgreSQL finance concurrency tests ผ่าน
- [ ] [AUTO] PostgreSQL promotion settlement tests ผ่าน
- [ ] [AUTO] PostgreSQL phone OTP tests ผ่าน
- [ ] [AUTO] PostgreSQL KYC concurrency tests ผ่าน
- [ ] [AUTO] PostgreSQL risk/watchlist concurrency tests ผ่าน
- [ ] [AUTO] Playwright public smoke tests ผ่าน
- [ ] [AUTO] Browser console/network quality gate ผ่าน

---

# 3. Database, Migration และ Data Integrity

## 3.1 Migration safety

- [ ] [STAGING] Backup database ก่อน migration สำเร็จและ restore ได้
- [ ] [STAGING] `prisma migrate status` ก่อน deploy ไม่มี migration ค้างผิดปกติ
- [ ] [STAGING] รัน migration จาก snapshot ที่เหมือน production ผ่าน
- [ ] [STAGING] migration rerun ไม่ทำให้ข้อมูลซ้ำหรือเสียหาย
- [ ] [STAGING] migration ใช้เวลาภายใน maintenance window
- [ ] [STAGING] migration ไม่ lock ตารางสำคัญนานเกิน threshold
- [ ] [STAGING] rollback/runbook ถูกทดลองจริง
- [ ] [PROD] ห้ามใช้ `prisma db push --force-reset`

## 3.2 Schema constraints

- [ ] [AUTO] username, phone และ email uniqueness ทำงานตาม contract
- [ ] [AUTO] Member มีบัญชีธนาคารได้ตามจำนวนที่ policy อนุญาต
- [ ] [AUTO] `MemberBankAccount.userId` uniqueness ทำงานตาม schema ปัจจุบัน
- [ ] [AUTO] เลขบัญชีธนาคารซ้ำถูกปฏิเสธ
- [ ] [AUTO] migration ตรวจ duplicate bank data ก่อนสร้าง unique index
- [ ] [AUTO] foreign keys ป้องกัน orphan records
- [ ] [AUTO] enum/status ใน schema ตรงกับ application transitions
- [ ] [AUTO] idempotency keys มี unique constraint ที่จำเป็น
- [ ] [AUTO] transaction references และ proof hashes ป้องกันข้อมูลซ้ำ

## 3.3 Transaction and concurrency

- [ ] [AUTO] deposit approve พร้อมกันสอง request เครดิตเพียงครั้งเดียว
- [ ] [AUTO] withdrawal complete พร้อมกันสอง request หักเงินเพียงครั้งเดียว
- [ ] [AUTO] claim operation พร้อมกันมี owner เพียงรายเดียว
- [ ] [AUTO] wallet row lock ป้องกัน lost update
- [ ] [AUTO] ยอด available/locked ไม่ติดลบ
- [ ] [AUTO] promotion settlement retry ไม่สร้าง ledger ซ้ำ
- [ ] [AUTO] recovery/OTP token ใช้พร้อมกันสำเร็จเพียงครั้งเดียว
- [ ] [AUTO] session refresh token rotation พร้อมกันไม่ออก session ซ้ำอย่างไม่ปลอดภัย

## 3.4 Data reconciliation

- [ ] [STAGING] ผลรวม wallet balance ตรงกับ ledger
- [ ] [STAGING] locked balance ตรงกับรายการ pending ที่เกี่ยวข้อง
- [ ] [STAGING] top-up credited ทุกรายการมี ledger reference
- [ ] [STAGING] withdrawal completed ทุกรายการมี debit ledger
- [ ] [STAGING] rejected/failed withdrawal คืน locked balance ครบ
- [ ] [STAGING] ไม่มี orphan media/object references
- [ ] [STAGING] ไม่มี verification token หมดอายุที่กระทบ query performance

---

# 4. Runtime Environment และ Infrastructure

## 4.1 Required environment

- [ ] [STAGING] `DATABASE_URL` ถูก service/environment
- [ ] [STAGING] `MEMBER_WEB_URL` และ `ADMIN_WEB_URL` ถูกต้อง
- [ ] [STAGING] `NEXT_PUBLIC_API_URL` ของทั้งสองเว็บชี้ API เดียวกัน
- [ ] [STAGING] `JWT_ACCESS_KEY` เป็นค่า random ที่แข็งแรง
- [ ] [STAGING] `TWO_FACTOR_ENCRYPTION_KEY` ถูกตั้งค่าและไม่ซ้ำกับ JWT key
- [ ] [STAGING] `GAME_CREDENTIAL_SECRET` ถูกตั้งค่า
- [ ] [STAGING] `ANTIBOT_ENCRYPTION_KEY` ถูกตั้งค่า
- [ ] [STAGING] `STORAGE_SIGNING_SECRET` ถูกตั้งค่า
- [ ] [STAGING] password-reset delivery URL/secret ถูกตั้งค่า
- [ ] [STAGING] ไม่มี development placeholder ใน production
- [ ] [AUTO] `scripts/verify-production-env.sh` ผ่าน

## 4.2 Redis and rate limiting

- [ ] [STAGING] Redis เชื่อมต่อได้
- [ ] [STAGING] API ทำงานต่อได้ตาม policy เมื่อ Redis ล่ม
- [ ] [STAGING] rate-limit key แยกตาม route
- [ ] [STAGING] login rate limit แยก IP และ account identity
- [ ] [STAGING] register, password reset และ 2FA มี rate limit
- [ ] [STAGING] provider webhook rate limit รองรับ burst ที่อนุมัติ
- [ ] [STAGING] response `429` มี `Retry-After`
- [ ] [STAGING] rate-limit key ไม่เก็บ username/phone/email แบบ plaintext

## 4.3 Reverse proxy and network

- [ ] [STAGING] trusted proxy hops ตรงกับ topology จริง
- [ ] [STAGING] client IP หลัง proxy ถูกต้อง
- [ ] [STAGING] spoofed `X-Forwarded-For` ไม่ข้าม policy
- [ ] [STAGING] CORS อนุญาตเฉพาะ Member/Admin origin
- [ ] [STAGING] cross-origin Admin mutation ถูกบล็อก
- [ ] [STAGING] HTTPS redirect/HSTS ทำงานตาม deployment policy
- [ ] [STAGING] API, Admin และ Member `/version` ตรง approved commit

---

# 5. API Global Contracts

## 5.1 Health and version

- [ ] [AUTO] `GET /health` ตอบสถานะสำเร็จ
- [ ] [AUTO] `GET /version` มี service, commit, environment และ builtAt
- [ ] [STAGING] health แสดง database/storage dependency อย่างถูกต้อง
- [ ] [STAGING] degraded dependency ไม่ถูกรายงานเป็น healthy เท็จ

## 5.2 Request/response behavior

- [ ] [AUTO] validation whitelist ตัด unknown fields
- [ ] [AUTO] malformed JSON ได้ error contract มาตรฐาน
- [ ] [AUTO] invalid UUID/enum/date/amount ถูกปฏิเสธ
- [ ] [AUTO] error response มี request ID และไม่เผย stack trace
- [ ] [AUTO] request ID ถูกส่งกลับใน header
- [ ] [AUTO] pagination มีขอบเขตสูงสุด
- [ ] [AUTO] filter/sort/search ไม่เปิด SQL injection
- [ ] [AUTO] response sanitizer ตัด password, hashes, secrets และ private storage keys
- [ ] [AUTO] auth routes คืน token เฉพาะ field/route ที่ allowlist
- [ ] [AUTO] circular object ไม่ทำให้ response crash

## 5.3 Security headers

- [ ] [STAGING] `X-Content-Type-Options: nosniff`
- [ ] [STAGING] frame embedding ถูกป้องกัน
- [ ] [STAGING] Referrer Policy ถูกต้อง
- [ ] [STAGING] Permissions Policy ถูกต้อง
- [ ] [STAGING] CSP ของ Web Admin/Member ไม่เปิด unsafe source เกินจำเป็น
- [ ] [STAGING] sensitive responses ใช้ `Cache-Control: no-store`

---

# 6. Member Authentication และ Account Lifecycle

## 6.1 Registration

- [ ] [MANUAL] สมัครด้วยข้อมูลถูกต้องสำเร็จ
- [ ] [AUTO] username/phone/email ซ้ำถูกปฏิเสธ
- [ ] [AUTO] เลขบัญชีธนาคารซ้ำถูกปฏิเสธแม้ request มาพร้อมกัน
- [ ] [MANUAL] ชื่อจริงกับชื่อบัญชีไม่ตรงถูกปฏิเสธ
- [ ] [MANUAL] password policy แสดงและบังคับใช้ตรงกันทั้ง UI/API
- [ ] [STAGING] anti-bot required/invalid/expired token ทำงานถูกต้อง
- [ ] [MANUAL] terms/privacy acceptance ทำงานตาม product policy
- [ ] [AUTO] failure ระหว่าง transaction ไม่ทิ้ง user/wallet/bank record บางส่วน

## 6.2 Login and session

- [ ] [MANUAL] login ด้วย username สำเร็จ
- [ ] [MANUAL] login ด้วย phone สำเร็จ
- [ ] [MANUAL] login ด้วย email สำเร็จ
- [ ] [AUTO] password ผิดได้ข้อความทั่วไป ไม่เปิดเผยว่าบัญชีมีจริง
- [ ] [AUTO] suspended/banned account login ไม่ได้
- [ ] [STAGING] progressive lockout ทำงานตาม threshold
- [ ] [STAGING] access token หมดอายุแล้ว refresh สำเร็จ
- [ ] [STAGING] refresh token rotation ทำงาน
- [ ] [STAGING] reuse refresh token เก่าทำให้ family ถูก revoke
- [ ] [MANUAL] logout ทำให้ current session ใช้ต่อไม่ได้
- [ ] [MANUAL] revoke other sessions ไม่ revoke current session
- [ ] [MANUAL] revoke specific session ทำงานและตรวจ ownership
- [ ] [MANUAL] current-device marker ถูกต้อง

## 6.3 Password reset and change

- [ ] [AUTO] reset request ไม่เปิดเผยว่าบัญชีมีอยู่หรือไม่
- [ ] [STAGING] reset delivery webhook ได้ token/recipient ที่จำเป็นตาม contract
- [ ] [STAGING] reset token ไม่ปรากฏใน production response/log
- [ ] [AUTO] reset token ใช้ selector lookup ไม่ scan token rows
- [ ] [AUTO] malformed, expired, used และ invalid token ถูกปฏิเสธ
- [ ] [AUTO] reset token ใช้ได้ครั้งเดียว
- [ ] [AUTO] reset password แล้ว revoke Member sessions ทั้งหมด
- [ ] [MANUAL] change password ตรวจ current password
- [ ] [MANUAL] change password สำเร็จแล้ว login ด้วยรหัสใหม่ได้

## 6.4 Phone/email/profile/security

- [ ] [MANUAL] update profile สำเร็จ
- [ ] [AUTO] phone/email ซ้ำถูกปฏิเสธด้วย error code ที่ถูกต้อง
- [ ] [AUTO] OTP request มี cooldown และ attempt limit
- [ ] [AUTO] OTP verify ป้องกัน replay และ brute force
- [ ] [MANUAL] session/security page แสดงข้อมูลถูกต้อง
- [ ] [MANUAL] masked personal data ไม่เผยข้อมูลเกิน policy

---

# 7. Admin Authentication, 2FA และ Authorization

## 7.1 Admin login

- [ ] [MANUAL] Admin active login สำเร็จ
- [ ] [AUTO] inactive/locked Admin login ไม่ได้
- [ ] [AUTO] invalid password เพิ่ม failure history
- [ ] [STAGING] lockout ทำงานตาม threshold/window
- [ ] [MANUAL] login page ไม่เก็บ access token ใน localStorage/sessionStorage
- [ ] [STAGING] refresh token อยู่ใน HttpOnly cookie
- [ ] [STAGING] cookie มี Secure/SameSite/Path/Max-Age ที่ถูกต้อง

## 7.2 Two-factor authentication

- [ ] [MANUAL] setup 2FA แสดง secret/QR เฉพาะขั้น setup
- [ ] [AUTO] 2FA secret ถูกเข้ารหัสในฐานข้อมูล
- [ ] [AUTO] production ขาด encryption key แล้ว startup fail closed
- [ ] [MANUAL] enable 2FA ด้วย TOTP ถูกต้องสำเร็จ
- [ ] [MANUAL] TOTP ผิดหรือหมดอายุถูกปฏิเสธ
- [ ] [AUTO] login password ผ่านแล้วออก short-lived challenge ไม่ออก session ทันที
- [ ] [AUTO] challenge ผูก IP/User-Agent ตาม policy
- [ ] [AUTO] expired/used/invalid challenge ใช้ไม่ได้
- [ ] [AUTO] challenge ใช้พร้อมกันสำเร็จเพียงครั้งเดียว
- [ ] [MANUAL] recovery code login สำเร็จหนึ่งครั้ง
- [ ] [MANUAL] recovery code เดิมใช้ซ้ำไม่ได้
- [ ] [MANUAL] regenerate recovery codes ทำให้ชุดเก่าใช้ไม่ได้
- [ ] [MANUAL] disable 2FA ต้องมี valid step-up code

## 7.3 RBAC and ownership

- [ ] [AUTO] unauthenticated Admin endpoints ตอบ `401`
- [ ] [AUTO] authenticated แต่ไม่มี permission ตอบ `403`
- [ ] [MANUAL] read-only role มองเห็นข้อมูลแต่ mutation controls ถูกซ่อน/ปิด
- [ ] [AUTO] เรียก mutation API ตรง ๆ โดยไม่มี permission ไม่ได้
- [ ] [AUTO] last Owner ถูก deactivate/delete/demote ไม่ได้
- [ ] [STAGING] ownership transfer สำเร็จแบบ transaction เดียว
- [ ] [STAGING] concurrent ownership transfer ไม่สร้าง Owner state ผิดปกติ
- [ ] [MANUAL] permission ลดลงแล้ว cached UI/API ใช้สิทธิ์เก่าต่อไม่ได้
- [ ] [AUTO] sensitive action ต้องมี reason และ audit record
- [ ] [AUTO] Admin session revoke one/all/others ตรวจ actor และ target ถูกต้อง

---

# 8. Wallet, Bank Account และ Ledger

## 8.1 Wallet invariants

- [ ] [AUTO] available balance = balance - locked balance
- [ ] [AUTO] balance และ locked balance ไม่ติดลบ
- [ ] [AUTO] mutation เงินทุกครั้งผ่าน Wallet/Ledger service ที่กำหนด
- [ ] [AUTO] direct balance edit นอก boundary ถูก audit/gate ตรวจพบ
- [ ] [AUTO] ledger มี before/after balance และ reference
- [ ] [AUTO] idempotency key เดิมไม่สร้าง movement ซ้ำ
- [ ] [MANUAL] Admin ledger explorer filter/search/pagination ถูกต้อง
- [ ] [MANUAL] amount/currency formatting ถูกต้องทั้งไทยและอังกฤษ

## 8.2 Member bank accounts

- [ ] [MANUAL] เพิ่มบัญชีธนาคารด้วยข้อมูลถูกต้อง
- [ ] [AUTO] account number รับเฉพาะรูปแบบที่กำหนด
- [ ] [AUTO] account number ซ้ำถูกปฏิเสธ
- [ ] [MANUAL] primary bank account แสดงถูกต้อง
- [ ] [MANUAL] pending/approved/rejected/disabled state แสดงถูกต้อง
- [ ] [AUTO] เปลี่ยนบัญชีสำคัญสร้าง audit/risk signal ตาม policy
- [ ] [MANUAL] Member ใช้ถอนเงินได้เฉพาะบัญชี approved
- [ ] [MANUAL] masked account number ถูกต้องทุกหน้า

## 8.3 Admin receiving accounts

- [ ] [MANUAL] create/update/enable/disable receiving account ทำงาน
- [ ] [MANUAL] min/max และ payment instructions แสดงตรง Member
- [ ] [MANUAL] QR/image fallback ทำงานเมื่อ media เสีย
- [ ] [AUTO] mutation ทุกครั้งมี permission และ audit log

---

# 9. Deposit / Top-up End-to-End

## 9.1 Member deposit

- [ ] [STAGING] Member เปิดหน้าฝากและเห็นบัญชีรับเงิน active
- [ ] [MANUAL] min/max amount validation ถูกต้อง
- [ ] [MANUAL] เลือก amount preset และกรอกเองได้
- [ ] [STAGING] upload slip ชนิด/ขนาดถูกต้องสำเร็จ
- [ ] [STAGING] file type, magic bytes หรือขนาดผิดถูกปฏิเสธ
- [ ] [MANUAL] slip preview และ retry state ทำงาน
- [ ] [AUTO] submit ซ้ำไม่สร้างรายการซ้ำ
- [ ] [AUTO] transaction reference, SHA-256 และ duplicate proof detection ทำงาน
- [ ] [MANUAL] Member เห็น pending/approved/rejected status ถูกต้อง

## 9.2 Admin deposit operation

- [ ] [STAGING] รายการใหม่ปรากฏใน queue
- [ ] [STAGING] Admin claim รายการสำเร็จ
- [ ] [AUTO] Admin อื่นแก้รายการที่ถูก claim ไม่ได้
- [ ] [STAGING] claim timeout/release ทำงาน
- [ ] [STAGING] protected slip preview โหลดได้
- [ ] [STAGING] approve slip ไม่เครดิต wallet ทันทีหาก flow แยก confirm
- [ ] [STAGING] confirm credit สร้าง ledger และเพิ่มยอดเพียงครั้งเดียว
- [ ] [AUTO] duplicate confirm/retry ไม่เพิ่มยอดซ้ำ
- [ ] [STAGING] reject ต้องมี reason และไม่เพิ่มยอด
- [ ] [STAGING] failure ระหว่าง storage/DB มี compensation cleanup
- [ ] [MANUAL] Member ได้ notification หลัง approved/rejected
- [ ] [AUTO] ทุก transition มี audit/history

---

# 10. Withdrawal End-to-End

## 10.1 Member withdrawal

- [ ] [MANUAL] เห็น available/locked balance ถูกต้อง
- [ ] [MANUAL] เลือกได้เฉพาะบัญชี approved
- [ ] [AUTO] amount ต่ำกว่า min/สูงกว่า max ถูกปฏิเสธ
- [ ] [AUTO] insufficient balance ถูกปฏิเสธ
- [ ] [AUTO] concurrent requests ใช้ยอดเกินไม่ได้
- [ ] [STAGING] request สำเร็จแล้วเพิ่ม locked balance ถูกต้อง
- [ ] [AUTO] duplicate submit/idempotency ทำงาน
- [ ] [MANUAL] fee และ net amount ถูกต้อง

## 10.2 Admin withdrawal operation

- [ ] [STAGING] รายการใหม่ปรากฏใน queue
- [ ] [STAGING] claim/release/timeout และ owner guard ทำงาน
- [ ] [STAGING] approve-for-payment transition ถูกต้อง
- [ ] [STAGING] upload payment proof ผ่าน private storage
- [ ] [AUTO] DB failure หลัง upload ลบ orphan object
- [ ] [STAGING] verify payment หักยอดและ locked balance ถูกต้อง
- [ ] [AUTO] verify ซ้ำไม่หักเงินซ้ำ
- [ ] [STAGING] reject/fail/cancel คืน locked balance ถูกต้อง
- [ ] [STAGING] terminal state ทำ action ซ้ำไม่ได้
- [ ] [MANUAL] Member เห็น status และ notification ถูกต้อง
- [ ] [AUTO] reason, proof reference, actor และ audit timeline ครบ

---

# 11. Promotions, Bonus, Affiliate และ Commission

- [ ] [MANUAL] promotion list แสดงเฉพาะ campaign ที่ active และอยู่ในช่วงเวลา
- [ ] [AUTO] eligibility ตรวจ min deposit, date, user และ prior claim
- [ ] [AUTO] claim ซ้ำถูกปฏิเสธ
- [ ] [STAGING] manual-review และ auto-pending mode ทำงานตาม config
- [ ] [STAGING] bonus settlement สร้าง ledger เพียงครั้งเดียว
- [ ] [AUTO] settlement retry idempotent
- [ ] [STAGING] reversal คืน state/ledger ถูกต้องและต้องมี reason
- [ ] [MANUAL] wager/turnover progress และ expiry แสดงถูกต้อง
- [ ] [AUTO] affiliate commission calculation ถูกต้อง
- [ ] [AUTO] self-referral/invalid hierarchy ถูกปฏิเสธ
- [ ] [MANUAL] Admin promotion/bonus/commission pages filter และ pagination ถูกต้อง
- [ ] [AUTO] ทุก sensitive settlement มี audit log

---

# 12. Notifications, Support, CMS และ Settings

## 12.1 Notifications

- [ ] [MANUAL] unread count ตรงกับรายการ
- [ ] [MANUAL] mark one/read all/archive ทำงาน
- [ ] [MANUAL] optimistic update rollback เมื่อ API ล้มเหลว
- [ ] [MANUAL] deep link ไป target ที่มีอยู่ได้
- [ ] [MANUAL] target ที่หาย/หมดอายุมี fallback state
- [ ] [MANUAL] notification preferences บันทึกและโหลดกลับถูกต้อง

## 12.2 Support tickets

- [ ] [MANUAL] FAQ search/category/no-result ทำงาน
- [ ] [MANUAL] ticket draft restore และ invalid draft cleanup ทำงาน
- [ ] [STAGING] Member สร้าง ticket และแนบไฟล์ได้
- [ ] [STAGING] Admin เห็น ticket พร้อม linked context
- [ ] [MANUAL] reply pending/sent/failed feedback ถูกต้อง
- [ ] [MANUAL] resolve/reopen lifecycle ถูกต้อง
- [ ] [STAGING] attachment download ต้องผ่าน authorization และ signed URL
- [ ] [AUTO] ลบ attachment metadata แล้วลบ object จริง
- [ ] [MANUAL] long conversation และ mobile composer ไม่พัง

## 12.3 CMS and site settings

- [ ] [MANUAL] website/branding/theme/SEO/contact/features/legal settings บันทึกได้
- [ ] [MANUAL] public settings เปิดเผยเฉพาะ safe fields
- [ ] [MANUAL] feature flags ปิด register/login/deposit/withdraw ตาม policy
- [ ] [MANUAL] maintenance mode ทำงานทั้ง global และ module
- [ ] [MANUAL] banners, popup, announcements และ FAQ แสดงตาม enabled/order
- [ ] [STAGING] upload/replace/delete CMS asset มี object lifecycle ครบ
- [ ] [MANUAL] broken image/video มี fallback
- [ ] [AUTO] settings mutations มี permission, validation และ audit history
- [ ] [MANUAL] legal page slug invalid ได้ not-found ที่เหมาะสม
- [ ] [MANUAL] robots/sitemap/metadata ถูกต้องตาม environment

---

# 13. KYC, Risk, Watchlist และ Security Operations

## 13.1 Member KYC

- [ ] [MANUAL] requirement/status card แสดงถูกต้อง
- [ ] [STAGING] upload image/PDF ที่อนุญาตสำเร็จ
- [ ] [STAGING] invalid type/size/content ถูกปฏิเสธ
- [ ] [MANUAL] submit confirmation และ lock state หลัง submit ถูกต้อง
- [ ] [MANUAL] pending/approved/rejected/expired/resubmit flow ทำงาน
- [ ] [MANUAL] rejected document และ review note แสดงชัดเจน
- [ ] [STAGING] KYC documents เป็น private และเข้าถึงข้าม user ไม่ได้

## 13.2 Admin KYC

- [ ] [MANUAL] queue filters/search/sort/pagination ถูกต้อง
- [ ] [STAGING] claim/review ownership ป้องกัน concurrent review
- [ ] [STAGING] secure preview/download ทำงาน
- [ ] [MANUAL] approve/reject ต้อง permission และ reason
- [ ] [AUTO] version conflict ถูกตรวจพบ
- [ ] [AUTO] review action มี audit timeline

## 13.3 Risk and watchlist

- [ ] [AUTO] duplicate slip, rapid withdrawal, high amount และ device/IP rules สร้าง alert
- [ ] [MANUAL] severity/status taxonomy แสดงถูกต้อง
- [ ] [MANUAL] assign/claim/release/resolve/reopen lifecycle ทำงาน
- [ ] [AUTO] watchlist matching รองรับ normalized phone/email/bank/device ตาม policy
- [ ] [AUTO] masked identifiers ไม่รั่วใน UI/log
- [ ] [STAGING] watchlist block การสมัคร/withdraw/profile ตาม policy
- [ ] [MANUAL] override ต้อง step-up, permission และ reason
- [ ] [AUTO] concurrent watchlist/KYC mutations ไม่ทำ state สูญหาย

---

# 14. Game Provider, Launch, Transfer, Webhook และ Reconciliation

## 14.1 Provider configuration

- [ ] [MANUAL] provider create/update/activate/maintenance ทำงาน
- [ ] [AUTO] endpoint URL/method/timeout/retry validation ถูกต้อง
- [ ] [AUTO] credential ถูกเข้ารหัสและ response แสดงเฉพาะ masked value
- [ ] [MANUAL] credential rotation และ disable ทำงาน
- [ ] [STAGING] test connection แสดง sanitized result
- [ ] [AUTO] real-money gate ปิดเมื่อ readiness requirements ไม่ครบ

## 14.2 Game catalog and launch

- [ ] [MANUAL] sync/import catalog ไม่สร้างเกมซ้ำ
- [ ] [MANUAL] active/inactive/maintenance/removed state แสดงถูกต้อง
- [ ] [MANUAL] search/provider/category/favorite/recent/featured ทำงาน
- [ ] [MANUAL] media fallback และ lazy loading ไม่เกิด layout shift
- [ ] [STAGING] demo launch สร้าง GameSession CREATED -> LAUNCHED
- [ ] [STAGING] failed launch เก็บ errorCode/errorMessage แบบ sanitized
- [ ] [STAGING] duplicate-launch guard ทำงาน
- [ ] [STAGING] provider-down/timeout/retry แสดง fallback ที่ปลอดภัย

## 14.3 Transfer dry-run and real-money gate

- [ ] [STAGING] transfer-in dry-run สร้าง GameTransfer
- [ ] [STAGING] transfer-out dry-run สร้าง GameTransfer
- [ ] [STAGING] dry-run ไม่เปลี่ยน wallet balance
- [ ] [AUTO] idempotency key เดิมไม่สร้าง transfer ซ้ำ
- [ ] [STAGING] retry/reversed/failed status lifecycle ถูกต้อง
- [ ] [VENDOR] real transfer amount/currency/provider transaction mapping ถูกต้อง
- [ ] [VENDOR] timeout หลัง provider รับคำสั่งแล้วไม่ส่งซ้ำแบบสร้างเงินซ้ำ

## 14.4 Webhooks

- [ ] [STAGING] valid signature ถูกยอมรับ
- [ ] [STAGING] invalid/missing/expired signature ถูกปฏิเสธ
- [ ] [STAGING] replay/timestamp tolerance ทำงาน
- [ ] [AUTO] duplicate idempotency key ถูกตรวจพบ
- [ ] [STAGING] receive-only webhook ไม่ mutate wallet
- [ ] [STAGING] raw/normalized payload ถูกเก็บและ redacted
- [ ] [STAGING] unknown event ไม่ทำให้ระบบ crash
- [ ] [VENDOR] IP whitelist/callback URL/headers ตรง vendor contract
- [ ] [VENDOR] error response และ retry behavior ตรง vendor contract

## 14.5 Reconciliation

- [ ] [STAGING] reconciliation สร้าง ProviderWalletSnapshot
- [ ] [STAGING] MATCHED/MISMATCH/UNKNOWN classification ถูกต้อง
- [ ] [MANUAL] MISMATCH/UNKNOWN ถูก highlight และไม่เปิดเงินจริง
- [ ] [STAGING] repeated reconciliation ไม่สร้าง side effect ทางการเงิน
- [ ] [VENDOR] provider balance ตรงกับ system/ledger หลัง transfer scenarios
- [ ] [VENDOR] manual review, note, retry และ resolution audit ครบ

---

# 15. File Storage และ Media Security

- [ ] [AUTO] global file-size limit ทำงาน
- [ ] [AUTO] MIME allowlist และ magic-byte validation ทำงาน
- [ ] [AUTO] SVG active content/script ถูกปฏิเสธหรือ sanitize ตาม policy
- [ ] [AUTO] plain-text/binary mismatch ถูกปฏิเสธ
- [ ] [STAGING] malware scanner success/failure/timeout behavior ถูกต้อง
- [ ] [STAGING] fail-closed ทำงานใน production mode
- [ ] [STAGING] local/S3/R2 driver contract ให้ผลเทียบเท่ากัน
- [ ] [STAGING] object key ไม่เปิด path traversal
- [ ] [STAGING] signed URL/token มี TTL cap และ timing-safe verification
- [ ] [STAGING] expired/tampered signed token ใช้ไม่ได้
- [ ] [STAGING] unauthorized user ดาวน์โหลด private object ไม่ได้
- [ ] [STAGING] upload failure และ DB rollback ไม่ทิ้ง orphan object
- [ ] [STAGING] delete metadata ลบ object ตาม lifecycle
- [ ] [PROD] retention policy และ lifecycle rule ได้รับอนุมัติ
- [ ] [PROD] backup/restore ของ object storage ถูกทดลอง

---

# 16. Web Admin Functional Coverage

- [ ] [MANUAL] Login/2FA/recovery/session-expired states
- [ ] [MANUAL] Dashboard metrics, loading, partial failure, retry และ stale timestamp
- [ ] [MANUAL] Finance summary และ reconciliation
- [ ] [MANUAL] Top-up queue และทุก action state
- [ ] [MANUAL] Withdrawal queue และทุก action state
- [ ] [MANUAL] Members search/filter/detail/masked fields
- [ ] [MANUAL] Wallets/ledgers/adjustment พร้อม reason/confirm
- [ ] [MANUAL] Bank-account review และ duplicate warning
- [ ] [MANUAL] KYC queue/detail/document/review
- [ ] [MANUAL] Risk alerts/watchlist/override/timeline
- [ ] [MANUAL] Promotions/bonus/affiliate/commission
- [ ] [MANUAL] Game providers/endpoints/credentials/presets/adapters
- [ ] [MANUAL] Game sessions/transfers/snapshots/reconciliation/webhooks
- [ ] [MANUAL] Reports/date range/trends/queue aging
- [ ] [MANUAL] CSV exports: correct headers, encoding, filters และ no-data
- [ ] [MANUAL] Activity/audit filters, JSON fallback และ pagination
- [ ] [MANUAL] Settings/CMS/assets/legal/maintenance/features
- [ ] [MANUAL] Support queue/thread/reply/resolve/reopen
- [ ] [MANUAL] Admin accounts/invitations/roles/permissions/ownership
- [ ] [MANUAL] Security sessions/login history/2FA/recovery
- [ ] [MANUAL] ทุกหน้าแสดง loading, empty, error, forbidden และ retry state

---

# 17. Web Member Functional Coverage

- [ ] [MANUAL] Public home, banners, announcements และ navigation
- [ ] [MANUAL] Register/login/forgot-reset/session-expired
- [ ] [MANUAL] Wallet summary และ quick actions
- [ ] [MANUAL] Deposit staged flow ทั้งหมด
- [ ] [MANUAL] Withdrawal staged flow ทั้งหมด
- [ ] [MANUAL] Transactions filter/pagination/detail
- [ ] [MANUAL] Bank accounts add/verify/default/disabled states
- [ ] [MANUAL] Games lobby/search/filter/favorite/launch/provider-down
- [ ] [MANUAL] Promotions/bonus eligibility/claim/progress/history
- [ ] [MANUAL] Profile/contact verification/password/security/sessions
- [ ] [MANUAL] KYC upload/status/rejection/resubmit
- [ ] [MANUAL] Notifications/read/archive/preferences/deep links
- [ ] [MANUAL] Support FAQ/ticket/attachment/reply/reopen
- [ ] [MANUAL] Affiliate/commission pages
- [ ] [MANUAL] Contact/legal/maintenance/fallback pages
- [ ] [MANUAL] ทุกหน้าแสดง loading, empty, error, offline, stale และ retry state

---

# 18. Responsive, Browser, Accessibility และ Localization

## 18.1 Viewports and browsers

- [ ] [MANUAL] iPhone Safari ขนาดเล็ก
- [ ] [MANUAL] iPhone Safari ขนาดมาตรฐาน
- [ ] [MANUAL] Android Chrome
- [ ] [MANUAL] Tablet portrait
- [ ] [MANUAL] Tablet landscape
- [ ] [MANUAL] Desktop 1366px
- [ ] [MANUAL] Desktop 1920px
- [ ] [MANUAL] Safari/Chrome/Firefox เวอร์ชันที่รองรับ
- [ ] [AUTO] authenticated six-viewport visual regression ผ่าน

## 18.2 Layout and interaction

- [ ] ไม่มี horizontal scroll โดยไม่ตั้งใจ
- [ ] cards, tables, inputs และ dialogs ไม่ล้น viewport
- [ ] safe-area และ mobile browser bars ไม่บัง action
- [ ] virtual keyboard ไม่บัง input/submit/composer
- [ ] long Thai/English text, UUID และจำนวนเงินไม่ทำ layout แตก
- [ ] touch target มีขนาดเหมาะสม
- [ ] hover-only action มีทางใช้งานบน touch
- [ ] modal/drawer ปิดแล้วคืน focus ถูก element
- [ ] navigation/scroll position ทำงานตาม product expectation
- [ ] reduced-motion ปิด animation ที่ไม่จำเป็น

## 18.3 Accessibility

- [ ] [AUTO] critical accessibility scan ไม่มี violation ระดับ critical
- [ ] [MANUAL] ใช้ keyboard อย่างเดียวได้ทุก critical flow
- [ ] [MANUAL] focus indicator มองเห็นชัด
- [ ] [MANUAL] headings และ landmarks มีลำดับถูกต้อง
- [ ] [MANUAL] form labels/error summary/ARIA live region ถูกต้อง
- [ ] [MANUAL] dialog/drawer มี focus trap และ Escape behavior
- [ ] [MANUAL] icon-only buttons มี accessible name
- [ ] [MANUAL] contrast ผ่านเกณฑ์ที่กำหนด
- [ ] [MANUAL] zoom 200% และ text reflow ยังใช้งานได้
- [ ] [MANUAL] status ไม่สื่อด้วยสีอย่างเดียว

## 18.4 Thai/English

- [ ] [MANUAL] เปลี่ยนภาษาแล้วข้อความหลักเปลี่ยนครบ
- [ ] [MANUAL] locale persist และไม่ทำ auth/session ผิดปกติ
- [ ] [MANUAL] error/status/validation ไม่มีข้อความคนละภาษาปะปนโดยไม่ตั้งใจ
- [ ] [MANUAL] วันเวลา timezone จำนวนเงิน และตัวเลข format ถูกต้อง
- [ ] [MANUAL] ข้อความยาวทั้งสองภาษาไม่ถูกตัดจนเสียความหมาย

---

# 19. Performance, Reliability และ Failure Injection

## 19.1 Performance

- [ ] [STAGING] API p95/p99 ของ critical endpoints อยู่ใน threshold
- [ ] [STAGING] login/deposit/withdraw queue ไม่เกิด N+1 query
- [ ] [STAGING] dashboard/report queries มี EXPLAIN evidence
- [ ] [STAGING] index ถูกใช้กับ production-scale data
- [ ] [STAGING] pagination จำกัด response size
- [ ] [STAGING] large CSV export ไม่ทำ API memory spike
- [ ] [STAGING] Web Admin/Member bundle และ route load อยู่ใน budget
- [ ] [MANUAL] mobile scroll/animation ไม่กระตุกชัดเจน
- [ ] [STAGING] cache TTL/invalidation/eviction ทำงาน
- [ ] [STAGING] stale cache ไม่แสดง permission หรือยอดเงินผิด

## 19.2 Failure injection

- [ ] [STAGING] database unavailable ได้ controlled error และ recover หลัง DB กลับมา
- [ ] [STAGING] Redis unavailable ใช้ fallback ตาม policy
- [ ] [STAGING] object storage unavailable ไม่รายงาน upload สำเร็จเท็จ
- [ ] [STAGING] malware scanner timeout ทำงานตาม fail-open/fail-closed policy
- [ ] [STAGING] provider timeout/retry ไม่สร้าง transfer ซ้ำ
- [ ] [STAGING] password reset webhook timeout ไม่ทำ API ค้างเกินกำหนด
- [ ] [STAGING] notification delivery failure ไม่ rollback financial transaction
- [ ] [STAGING] process restart ระหว่าง operation ไม่ทำเงินซ้ำ
- [ ] [STAGING] concurrent deploy ไม่ทำ migration ซ้ำผิดปกติ

## 19.3 Soak and load

- [ ] [STAGING] login/rate-limit soak test
- [ ] [STAGING] finance read/query load test
- [ ] [STAGING] queue polling load test
- [ ] [STAGING] provider webhook burst test
- [ ] [STAGING] session/verification-token cleanup under sustained use
- [ ] [STAGING] memory/CPU/database connections กลับสู่ baseline หลัง load

---

# 20. Security Verification

- [ ] [AUTO] dependency audit ผ่าน
- [ ] [AUTO] secret scan ผ่าน
- [ ] [AUTO] token storage/XSS static audit ผ่าน
- [ ] [AUTO] Admin mutation CSRF/origin audit ผ่าน
- [ ] [AUTO] authorization policy tests ผ่าน
- [ ] [MANUAL] IDOR test กับ Member/Admin resources สำคัญ
- [ ] [MANUAL] privilege escalation ผ่าน hidden UI/API routes ทำไม่ได้
- [ ] [MANUAL] mass assignment ถูก whitelist ป้องกัน
- [ ] [MANUAL] SQL/NoSQL/command injection payload ถูกปฏิเสธ
- [ ] [MANUAL] stored/reflected XSS ใน CMS, support, notes และ metadata ไม่ execute
- [ ] [MANUAL] file upload polyglot/path traversal ถูกปฏิเสธ
- [ ] [MANUAL] open redirect ใน login/deep link ไม่มี
- [ ] [MANUAL] sensitive values ไม่ปรากฏใน logs, errors, traces หรือ browser storage
- [ ] [STAGING] session fixation/replay/rotation tests ผ่าน
- [ ] [STAGING] brute-force/rate-limit/lockout ไม่ bypass ผ่าน proxy headers
- [ ] [STAGING] 2FA/recovery/password-reset tokens ใช้ซ้ำไม่ได้
- [ ] [STAGING] encrypted secrets decrypt ได้ด้วย key ปัจจุบันและ key ผิดใช้ไม่ได้
- [ ] [PROD] secret rotation/incident runbook ได้รับการทบทวน

---

# 21. Observability และ Operations

- [ ] [STAGING] structured logs เป็น JSON ตาม schema
- [ ] [STAGING] logs มี request ID, route, status และ duration
- [ ] [STAGING] logs redact token/password/secret/PII ตาม policy
- [ ] [STAGING] auth success/failure/lockout metrics ถูกบันทึก
- [ ] [STAGING] finance settlement/retry/failure metrics ถูกบันทึก
- [ ] [STAGING] provider health/timeout/webhook metrics ถูกบันทึก
- [ ] [STAGING] database query/slow query metrics ถูกบันทึก
- [ ] [STAGING] alert สำหรับ crash loop, migration failure และ finance smoke ทำงาน
- [ ] [STAGING] alert ไม่มี secret/PII ใน payload
- [ ] [MANUAL] Admin audit log แสดง actor/action/target/reason/time ถูกต้อง
- [ ] [MANUAL] audit records แก้/ลบจาก UI ไม่ได้
- [ ] [PROD] on-call, escalation และ incident owner ถูกกำหนด

---

# 22. Deployment, Rollback และ Disaster Recovery

## 22.1 Pre-deploy

- [ ] Approved commit ตรงกับ artifact ที่จะ deploy
- [ ] CI required checks ผ่านทั้งหมด
- [ ] migration plan และ estimated lock time ได้รับการทบทวน
- [ ] database/object-storage backup สำเร็จ
- [ ] rollback trigger และ owner ชัดเจน
- [ ] production environment verification ผ่าน
- [ ] real-money/provider gates อยู่ในสถานะที่อนุมัติ

## 22.2 Deployment order

- [ ] deploy database migration ตาม runbook
- [ ] deploy API
- [ ] verify API health/version
- [ ] deploy Web Admin
- [ ] verify Admin version/login
- [ ] deploy Web Member
- [ ] verify Member version/login
- [ ] ทั้งสาม service รายงาน commit เดียวกัน

## 22.3 Post-deploy smoke

- [ ] [PROD] `/health` และ `/version` ผ่าน
- [ ] [PROD] ไม่มี crash loop หรือ migration error
- [ ] [PROD] database/storage/Redis status ปกติ
- [ ] [PROD] Admin login/refresh/logout ผ่าน
- [ ] [PROD] Member login/refresh/logout ผ่าน
- [ ] [PROD] Admin dashboard/finance/topups/withdrawals/risk โหลดได้
- [ ] [PROD] Member wallet/deposit/withdraw/transactions โหลดได้
- [ ] [PROD] protected media preview ผ่าน
- [ ] [PROD] read-only role และ permission denial ถูกต้อง
- [ ] [PROD] smoke test ไม่เปลี่ยนเงินจริง

## 22.4 Rollback and recovery

- [ ] [STAGING] application rollback ไป commit ก่อนหน้าได้
- [ ] [STAGING] backward compatibility ระหว่าง app/migration ผ่าน deployment window
- [ ] [STAGING] database restore ได้ภายใน RTO
- [ ] [STAGING] data loss ไม่เกิน RPO
- [ ] [STAGING] object storage restore และ signed access หลัง restore ทำงาน
- [ ] [STAGING] Redis/cache loss ไม่ทำข้อมูลถาวรสูญหาย
- [ ] [MANUAL] runbook มีคำสั่งจริง ผู้รับผิดชอบ และช่องทางสื่อสาร

---

# 23. Production/Vendor Final Approval

- [ ] [PROD] production migration status ตรง approved commit
- [ ] [PROD] production-scale query/index evidence ผ่าน
- [ ] [PROD] aggregate/cache workload evidence ผ่าน
- [ ] [PROD] storage retention/malware policy ได้รับอนุมัติ
- [ ] [VENDOR] endpoint, credentials, signature และ error contract ยืนยันแล้ว
- [ ] [VENDOR] IP whitelist และ callback registration เสร็จ
- [ ] [VENDOR] transfer/retry/reversal/reconciliation UAT ผ่าน
- [ ] [VENDOR] webhook duplicate/replay/UAT ผ่าน
- [ ] [VENDOR] provider downtime procedure ทดลองแล้ว
- [ ] [VENDOR] business/finance/security owner sign-off
- [ ] real-money flag ยังปิดจนกว่ารายการด้านบนผ่านทั้งหมด

---

# 24. Hard No-Go Conditions

ห้าม deploy หรือห้ามเปิดเงินจริง หากพบอย่างใดอย่างหนึ่ง:

- [ ] ไม่มี unreviewed migration หรือ destructive schema change
- [ ] ไม่มี failing required CI check
- [ ] ไม่มี API/Admin/Member commit mismatch
- [ ] ไม่มี wallet/ledger reconciliation mismatch
- [ ] ไม่มี negative balance หรือ duplicate financial mutation
- [ ] ไม่มี authentication/authorization bypass
- [ ] ไม่มี secret หรือ private data leak
- [ ] ไม่มี provider signature/idempotency/replay test ที่ยังไม่ผ่าน
- [ ] ไม่มี MISMATCH/UNKNOWN reconciliation ที่ยังไม่ resolve
- [ ] ไม่มี backup/restore test ที่ยังไม่ผ่าน
- [ ] ไม่มี production crash loop หรือ critical alert ที่ยังเปิด

> หมายเหตุ: checkbox ในส่วนนี้ต้องติ๊กได้ทั้งหมดในความหมายว่า “ยืนยันว่าไม่มีเงื่อนไขดังกล่าว” ก่อน Go Live

---

# 25. Test Result Summary

| หมวด                              | ผ่าน | ไม่ผ่าน | Blocked | หมายเหตุ/Evidence |
| --------------------------------- | ---: | ------: | ------: | ----------------- |
| Repository / Build / Static       |      |         |         |                   |
| Database / Migration              |      |         |         |                   |
| API / Infrastructure              |      |         |         |                   |
| Member Auth / Account             |      |         |         |                   |
| Admin Auth / RBAC / 2FA           |      |         |         |                   |
| Wallet / Bank / Ledger            |      |         |         |                   |
| Deposit                           |      |         |         |                   |
| Withdrawal                        |      |         |         |                   |
| Promotion / Affiliate             |      |         |         |                   |
| Notifications / Support / CMS     |      |         |         |                   |
| KYC / Risk                        |      |         |         |                   |
| Provider / Games / Webhooks       |      |         |         |                   |
| Storage                           |      |         |         |                   |
| Admin UI                          |      |         |         |                   |
| Member UI                         |      |         |         |                   |
| Responsive / Accessibility / i18n |      |         |         |                   |
| Performance / Reliability         |      |         |         |                   |
| Security                          |      |         |         |                   |
| Observability / Operations        |      |         |         |                   |
| Deployment / DR / Vendor UAT      |      |         |         |                   |

## Defects

| ID  | Severity | Domain | Scenario | Expected | Actual | Evidence | Owner | Status |
| --- | -------- | ------ | -------- | -------- | ------ | -------- | ----- | ------ |
|     |          |        |          |          |        |          |       |        |

## Final decision

- [ ] PASS — อนุมัติ deploy
- [ ] CONDITIONAL PASS — อนุมัติพร้อมข้อจำกัด: `____________________________`
- [ ] FAIL — ห้าม deploy/ห้ามเปิดเงินจริง

ผู้อนุมัติ Engineering: `____________________________`

ผู้อนุมัติ QA: `____________________________`

ผู้อนุมัติ Security: `____________________________`

ผู้อนุมัติ Finance/Operations: `____________________________`

วันที่อนุมัติ: `____________________________`
