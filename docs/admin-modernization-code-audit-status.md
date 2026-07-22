# Admin Modernization — Code Audit Index

อัปเดต: 2026-07-23

ไฟล์สถานะหลักสำหรับทำงานต่อ:

- [`admin-modernization-chat-worklist.md`](./admin-modernization-chat-worklist.md)

ไฟล์นี้เป็นเพียงดัชนีหลักฐานจากการตรวจโค้ดบน `main` เพื่อไม่ให้มี checkbox หลายชุดขัดกัน

## หลักฐานแยกตามหมวด

- [`admin-modernization-reports-members-audit.md`](./admin-modernization-reports-members-audit.md) — Reports, Bank Accounts, KYC
- [`admin-modernization-risk-promotion-audit.md`](./admin-modernization-risk-promotion-audit.md) — Risk Alerts, Provider Risk, Growth, Promotion Center
- [`admin-modernization-admin-security-audit.md`](./admin-modernization-admin-security-audit.md) — Accounts, Roles, Invitations, Audit, Settings, Anti-bot, Security
- [`admin-modernization-games-content-audit.md`](./admin-modernization-games-content-audit.md) — Game Transfers, Webhook Logs, Promotion Claims, Content Center
- [`admin-modernization-growth-login-phase2-audit.md`](./admin-modernization-growth-login-phase2-audit.md) — Bonus, Affiliate, Commission, Login, Phase 2
- [`admin-modernization-dashboard-support-wallet-audit.md`](./admin-modernization-dashboard-support-wallet-audit.md) — Dashboard, Wallet Statement, Wallet Analytics, Support Center, Audit Risk

## ความหมายสถานะ

- `[x]` ยืนยันจากโค้ดแล้ว
- `[~]` ทำบางส่วนหรือยังขาดหลักฐานทั้งระบบ
- `[ ]` ยังไม่พบหรือยังไม่ครบ

ห้ามใช้ชื่อ workflow, ชื่อ component หรือข้อความใน PR เป็นหลักฐานว่าเสร็จโดยลำพัง ต้องตรวจ implementation และผลรันที่เกี่ยวข้องก่อนติ๊ก `[x]`
