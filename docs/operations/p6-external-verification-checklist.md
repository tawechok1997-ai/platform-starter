# P6 External Verification Checklist

เอกสารนี้เป็นคู่มือรันงาน P6 ที่ต้องใช้ deployed environment, credentials, production access หรือข้อมูลจาก vendor โดยไม่เปลี่ยนสถานะ checkbox ใน `docs/master-project-worklist.md` จนกว่าจะมีหลักฐานครบ

## 1. ข้อมูลที่ต้องเตรียม

### Seeded accounts

- Admin owner account สำหรับ owner-transfer และ account lifecycle
- Admin read-only account สำหรับ permission regression
- Member account ที่มีสถานะพร้อมทำ deposit/withdraw
- Member account สำหรับ KYC/risk regression
- ข้อมูลต้องเป็น non-production หรือบัญชี production ที่ได้รับอนุมัติโดยชัดเจน

ห้ามบันทึกรหัสผ่าน, OTP seed, refresh token หรือ API key ลง repository, issue, artifact หรือ log

### Deployed endpoints

- Admin URL
- Member URL
- API URL
- Health/version endpoint
- Reverse-proxy entrypoint
- Provider callback/webhook URL ที่ vendor อนุมัติ

### Environment approvals

- ผู้อนุมัติ staging migration/rollback
- ผู้อนุมัติ production verification
- Storage retention owner
- Malware scanner owner
- Vendor/provider contact และ UAT approver

## 2. Preflight

```bash
pnpm check:runtime
pnpm check:repository
pnpm typecheck
pnpm audit:dependency-security
pnpm verify:p6:readiness:strict
pnpm verify:p6:connectivity:strict
pnpm verify:p6:deployment:strict
```

หยุดการทดสอบเมื่อ approved commit, deployment health/version หรือ environment identity ไม่ตรงกัน

## 3. ลำดับการรัน

1. ยืนยัน deployment identity และ approved commit
2. รัน login, refresh, logout และ cookie regression
3. รัน permission regression ด้วย owner และ read-only account
4. รัน deposit/withdraw happy path, duplicate, retry และ error path
5. รัน notification rollback, support, CMS และ reports
6. รัน KYC/risk และ six-viewport visual regression
7. รัน provider-down, proxy, anti-bot และ session rotation
8. ตรวจ migration, aggregate/cache, index และ storage policies
9. ทำ vendor signature, reconciliation และ provider-specific UAT

## 4. Evidence requirements

แต่ละรายการต้องมี:

- วันที่และ timezone
- environment และ URL ที่ทดสอบ
- approved commit SHA
- ผู้รันและผู้อนุมัติ
- command/spec ที่ใช้
- expected result และ actual result
- screenshot, trace, log หรือ query evidence ที่ไม่เปิดเผย secret
- issue/incident link เมื่อไม่ผ่าน
- retest evidence หลังแก้ไข

ใช้ `docs/evidence/p6-verification-run-template.md` เป็นแม่แบบ

## 5. Stop conditions

หยุดทันทีเมื่อพบ:

- deployment ไม่ตรง approved commit
-เงินจริงหรือบัญชีลูกค้าจริงถูกใช้โดยไม่มีอนุมัติ
- credential หรือ personal data ปรากฏใน log/artifact
- ledger, wallet หรือ provider reconciliation ไม่สมดุล
- migration status ไม่ตรง schema ที่อนุมัติ
- malware scanner หรือ private storage policy อยู่ใน fail-open โดยไม่ได้รับอนุมัติ
- vendor signature/error contract ไม่ตรงเอกสารล่าสุด

## 6. Closure rule

การผ่านคำสั่งใน local repository ไม่ถือว่าปิด P6 ต้องมีหลักฐานจาก environment จริงตามรายการใน `docs/master-project-worklist.md` และได้รับการอนุมัติจาก owner ที่เกี่ยวข้องก่อนเปลี่ยน `[ ]` เป็น `[x]`
