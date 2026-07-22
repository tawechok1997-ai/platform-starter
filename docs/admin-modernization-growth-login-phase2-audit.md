# Admin Modernization Audit — Growth, Login และ Phase 2

อัปเดต: 2026-07-23

สถานะในเอกสารนี้ยืนยันจากโค้ดบน `main` เท่านั้น

## `/bonus-ledgers`

- [x] Turnover progress และ progress bar
- [x] Active / Completed / Expired / Revoked / Settled lifecycle
- [x] แสดง wallet-credit state และผลกระทบต่อกระเป๋าเงิน
- [x] จ่ายโบนัสได้เฉพาะเมื่อ turnover ครบ
- [x] Release / Expire / Revoke แยก action
- [x] Expire และ Revoke บังคับเหตุผล
- [x] Confirmation แสดงสมาชิก ยอดโบนัส และ turnover ก่อนจ่ายเงินจริง
- [x] Timeline เหตุการณ์ย้อนหลัง
- [~] Async mutation ยังไม่มี `try/catch/finally` ครบ และบาง error แสดง backend message

## `/affiliate-center`

- [x] Downline tree ระดับแรก
- [x] Pending / Approved / Rejected review
- [x] Commission rule และ payout state
- [x] Duplicate referral warning
- [x] ป้องกัน approve เมื่อ referral code ซ้ำ
- [x] Auto payout และ commission ledger ถูกปิดเป็น safe default
- [~] ยังใช้ `window.confirm`
- [~] ยังไม่มี nested downline tree หรือ server-side duplicate contract evidence
- [~] Async workflow ยังไม่มี `try/finally` ครบ

## `/commission-ledgers`

- [x] Calculation preview
- [x] Basis / rate / cap
- [x] Preview แยกจาก create ledger
- [x] Confirmation ก่อนสร้าง ledger
- [x] แสดง calculated amount และ manual override
- [x] Review approve/reject แยกจาก payout
- [x] Payout ยังปิดและไม่เพิ่มเงินจริงเข้ากระเป๋า
- [~] Reject reason เป็นข้อความระบบตายตัว ไม่ใช่เหตุผลจากผู้ดูแล
- [~] ยังใช้ `window.confirm`
- [~] Async workflow ยังไม่มี `try/finally` ครบ

## `/login`

- [x] รองรับภาษาไทยและอังกฤษ พร้อมจำ locale
- [x] Field-level validation และ accessible error binding
- [x] Busy state ป้องกัน submit ซ้ำ
- [x] Timeout และ safe login error
- [x] CAPTCHA / Anti-bot integration
- [x] 2FA challenge แยกจาก username/password login
- [x] รองรับ TOTP หรือ recovery code
- [x] Reset CAPTCHA หลังผลล้มเหลวหรือเปลี่ยนขั้นตอน
- [x] ตรวจ existing refresh token และ redirect ไป Dashboard
- [~] Branding ยัง hard-code `A` และ `Admin Console`
- [~] ยังไม่มีหลักฐาน browser automation ครบ success/failure/2FA/CAPTCHA

## Phase 2 — หลักฐานที่ตรวจได้รอบนี้

- [~] Repository มี Build, Quality Gate, Security Audit, Architecture Contracts และ Full-System Automated Tests workflows
- [~] มี automated test coverage หลายชั้น แต่ยังไม่ยืนยัน E2E ครบ approve/reject/pay/wallet/role change พร้อม audit และ permission
- [ ] ยังไม่มีหลักฐานจากรอบ audit นี้ว่า seeded UAT accounts แยกทุก role พร้อมใช้งาน
- [ ] ยังไม่ยืนยัน feature-flag gradual rollout และ rollback ครบ Demo/UAT/Production
- [ ] ยังไม่ยืนยัน PII/secret/payment redaction ครบ error tracking และ structured logs
- [ ] ยังไม่ยืนยัน trace ID ครบ UI → API → DB → Provider
- [ ] ยังไม่ยืนยัน SLO dashboard ครบ error rate, latency, queue aging, webhook fail และ provider downtime
- [ ] ยังไม่ยืนยัน Lighthouse/performance budget สำหรับ authenticated Admin routes
- [ ] ยังไม่ยืนยัน backup-restore drill อัตโนมัติพร้อม restore evidence
- [ ] ยังไม่ยืนยัน authenticated browser visual regression ครบ viewport และ permission role

## สรุป

Growth sub-routes และ Login ทำไปมากกว่าลิสต์เดิมอย่างชัดเจน แต่ Phase 2 ยังห้ามติ๊กจากชื่อ workflow อย่างเดียว ต้องมีผลรัน หลักฐาน artifacts และ coverage mapping ก่อนจึงถือว่าเสร็จจริง
