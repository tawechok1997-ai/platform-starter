# Admin Redesign P8 — Security, Accessibility และ Release Readiness

PR: `#497`

Branch: `agent/admin-phase-8-security-release-readiness`

Stack base ชั่วคราว: `agent/admin-phase-5-7-data-settings-design-system`

สถานะ: **Draft / Implementation** — ห้าม Merge ก่อน P2, P4 และ P5–P7 ถูก Merge, Branch ถูก Retarget/Sync กับ `main` และ Required CI ผ่านบน Head เดียวกัน

## CI snapshot

- Last verified P8 evidence head: `d45ecb605241c5e167b4e1af66f0d8c196447bda`
- P8-specific workflows: **7/7 ผ่าน**
- Base workflows ที่แดง: 3 รายการและไม่อยู่ใน P8 diff
- Documentation-only commits หลัง SHA นี้ยังต้องผ่าน Required CI บน PR Head ก่อน Merge

Base blockers:

1. `R012 Frontend Architecture` — Member tests บน Base #492
2. `R-006 Quality Baseline` — Member lint บน Base #492
3. `Build` — Provider simulator catalog contract บน Base #492

## Ownership boundary

P8 เป็น Release gate และไม่สร้าง Owner ซ้ำ:

- P2: Role, Team, Effective access, Scope, Limit และ DENY
- P3: Workspace selection และ Navigation visibility
- P4: Chart, Widget และ Dashboard interaction
- P5: Table, Form และ Drawer
- P6: `/settings` และ `/system-settings`
- P7: Design-system ownership และ CSS cleanup
- P8: Security policy, Accessibility, Browser coverage, Resilience, Performance และ Release evidence

## Route closure ✅

Route ที่อยู่ใน P8 coverage รวม **83 routes**:

- Navigation registry: 57
- Additional, nested และ Legacy permission registry: 26
- Unregistered known routes: 0

งานที่ปิดแล้ว:

- เพิ่ม `/system-settings` เข้า Navigation และ Permission registry
- เพิ่ม `/settings/activities` ด้วย `settings.features.view`
- Specific nested route ชนะ Parent route ด้วย longest-prefix ordering
- ผูก `/system-settings` และ nested routes กับ Workspace `settings`
- Unknown route ถูกปฏิเสธแม้ Admin มี wildcard `*`
- Layout ใช้ `canAccessPath()` Owner กลาง
- มี Regression tests ป้องกัน Permission formula ซ้ำและ Route หลุด Registry

## Security policy foundation ✅

Policy กลางรองรับ:

- Permission หรือ wildcard authority
- Step-up evidence ผูกกับ Admin และ Session เดียวกัน
- Step-up freshness และ clock-skew validation
- เหตุผลขั้นต่ำสำหรับ Sensitive action
- Single/Dual approval
- Deduplicate approver
- No requester self-approval
- No target self-approval
- Wildcard ไม่ข้าม Step-up, Reason หรือ Approval
- Fail closed เมื่อ Policy ไม่ผ่าน

Sensitive reveal evidence:

- เก็บ Action, Permission, Actor, Session, Requester, Target และ Approver
- เก็บ Step-up method/time
- เก็บเฉพาะชื่อ Field ที่เปิดเผยและเวลา Expiry
- ไม่รับหรือบันทึก Secret value

Files:

- `apps/api/src/common/admin-sensitive-action-policy.ts`
- `apps/api/src/common/admin-sensitive-action-policy.spec.ts`

ข้อจำกัด:

- Policy contract พร้อมแล้ว
- การเชื่อมเข้ากับ Endpoint จริงรอ Sync P2/P6 เพื่อไม่สร้าง Service owner ซ้ำ

## Accessibility และ Browser evidence ✅

Routes หลักที่ใช้เป็น P8 smoke owner:

- `/system-settings`
- `/settings/activities`

Coverage ที่ยืนยันแล้ว:

- Main, Heading และ Link landmarks
- Keyboard focus ไม่ตกที่ Document body
- Focus target มองเห็นได้
- Form control มี Label หรือ ARIA name
- Reduced motion
- Horizontal page overflow
- Forced-colors
- WCAG text-spacing
- Long admin name/role บน Desktop, Tablet และ Mobile
- Responsive Drawer อยู่ในขอบ Viewport
- 200% desktop-equivalent reflow ที่ CSS viewport 720px
- Drawer Escape และ Focus restore หลังปิด
- Chromium Desktop/Tablet/Mobile
- Firefox Desktop
- WebKit Desktop
- Permission-denied title มี Heading semantics
- Confirm Modal คืน Focus ไป Trigger
- Dialog semantics, focus containment, Escape และ Scroll lock contracts
- Data Table keyboard rows, sorting, pagination และ live status contracts
- Sensitive-display expiry contract

Files:

- `tests/admin-browser-matrix/admin-p8-route-accessibility.spec.ts`
- `tests/admin-browser-matrix/admin-p8-zoom-reflow.spec.ts`
- `tests/admin-browser-matrix/admin-p8-persona-access.spec.ts`

## Persona และ Release matrix ✅

Persona 7 แบบ:

1. Finance
2. Deposit & Withdrawal
3. Marketing
4. Manager
5. System Administrator
6. Multi-role
7. Explicit DENY override

Required matrix:

- Tier 0 routes: 15
- Required cases: 225
- Deterministic sharding: 5 shards × 45 cases
- ไม่มีเคสซ้ำและรวมกลับได้ครบ
- Role codes ใช้ Template จริงจาก P2
- Multi-role ใช้ Permission union
- Explicit DENY ชนะแบบ fail-closed

Browser evidence มี Marketing allow, Finance deny, System Admin allow และ Explicit DENY บน Responsive matrix

## Session และ Network resilience ✅

- 401 refresh ได้หนึ่งครั้ง
- Retry แล้วยัง 401 ต้องกลับ Login
- 403 ไม่ทำลาย Session
- 2FA-required ไม่วน Redirect
- Request timeout 15 วินาที
- Read-only request retry ได้หนึ่งครั้งเฉพาะ Network/Timeout และ 408/425/429/502/503/504
- `Retry-After` ถูกจำกัดไม่เกิน 1 วินาที
- Mutation, 401, 403 และ Caller cancellation ไม่ถูก retry อัตโนมัติ
- Browser evidence ยืนยัน `/auth/me` ล้ม 503 ครั้งแรกและสำเร็จที่ Attempt 2 โดยไม่ Redirect ไป Login
- Transport owner ใช้ Policy กลางทั้ง Request ปกติ, Retry หลัง Refresh และ Refresh endpoint

Files:

- `apps/web-admin/app/admin-network-policy.ts`
- `apps/web-admin/app/admin-network-policy.spec.ts`
- `apps/web-admin/app/admin-api.ts`

## Performance gate ✅

Production bundle gate อ่าน Build manifest และวัด gzip จากไฟล์จริง:

- Route budget: 220 KB gzip
- วัดแล้ว: 95 routes
- Route ใหญ่สุด: `/security` 141.55 KB gzip
- Chunk budget: 160 KB gzip
- วัดแล้ว: 131 chunks
- Chunk ใหญ่สุด: 58.48 KB gzip

Files:

- `apps/web-admin/performance-budget.json`
- `apps/web-admin/tools/check-performance-budget.mjs`
- `apps/web-admin/package.json`

## Remaining — 4 กลุ่ม

1. เชื่อม Security policy เข้ากับ P2/P6 sensitive endpoints หลัง Dependency Sync
2. เพิ่ม Browser interaction สำหรับ Drawer, Modal, Table, Tabs, Security และ Chart หลัง P4/P5 Sync
3. เพิ่ม Large-table/long-dataset visual evidence และ Offline/Recovery browser scenarios
4. Retarget `main`, Sync dependencies, รัน Final release gate และ Production smoke

## Definition of Done

- Route inventory 83 รายการมี Permission และ Workspace owner ครบ
- ไม่มีหน้าใหม่หลุด Route audit หรือ Browser smoke
- Sensitive endpoints เรียก P8 policy จริงหลัง Sync P2/P6
- `/security` ใช้ Owner เดิมสำหรับ Session, 2FA, Recovery และ Step-up
- Tier 0 ผ่าน Security, Accessibility และ Browser coverage ตาม Persona และ Viewport
- Legacy routes มี Redirect/Deprecated/Read-only contract ตาม P6 inventory
- Required CI ผ่านบน Head เดียวกัน
- Branch ถูก Retarget/Sync เข้า `main` หลัง P2, P4 และ P5–P7 Merge
