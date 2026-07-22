# Admin Modernization — Audit Evidence Index

อัปเดต: 2026-07-23

ลิสต์หลักที่ใช้ติดตามงานต่อคือ:

- [`admin-modernization-chat-worklist.md`](./admin-modernization-chat-worklist.md)

สถานะในลิสต์หลักใช้ความหมายดังนี้:

- `[x]` ยืนยันจากโค้ดบน `main`
- `[~]` มี implementation บางส่วน หรือยังขาดหลักฐานทั้งระบบ
- `[ ]` ยังไม่พบหลักฐานเพียงพอ หรือยังไม่ครบ

## เอกสารหลักฐานแยกตามหมวด

- [`admin-modernization-reports-members-audit.md`](./admin-modernization-reports-members-audit.md) — Reports, Bank Accounts และ KYC
- [`admin-modernization-risk-promotion-audit.md`](./admin-modernization-risk-promotion-audit.md) — Risk Alerts, Provider Risk, Growth และ Promotion Center
- [`admin-modernization-admin-security-audit.md`](./admin-modernization-admin-security-audit.md) — Admin Accounts, Roles, Invitations, Audit, Settings, Anti-bot และ Security
- [`admin-modernization-games-content-audit.md`](./admin-modernization-games-content-audit.md) — Game Transfers, Webhook Logs, Promotion Claims และ Content Center
- [`admin-modernization-growth-login-phase2-audit.md`](./admin-modernization-growth-login-phase2-audit.md) — Bonus, Affiliate, Commission, Login และ Phase 2

## กติกาการอัปเดต

1. อัปเดต checkbox ในลิสต์หลักเมื่อมีหลักฐานจากโค้ดหรือผลทดสอบ
2. ใช้ `[~]` เมื่อ implementation มีจริงแต่ยังไม่ครบขอบเขตหรือยังขาด browser/CI evidence
3. ห้ามติ๊ก Phase 2 หรือ Definition of Done จากชื่อ workflow เพียงอย่างเดียว
4. เอกสารหลักฐานอาจละเอียดกว่า แต่ห้ามมีสถานะขัดกับลิสต์หลัก
