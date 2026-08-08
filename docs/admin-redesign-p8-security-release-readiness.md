# Admin Redesign P8 — Security, Accessibility และ Release Readiness

## สถานะปัจจุบัน

- PR: `#554`
- Final branch: `rebuild/admin-phase-8-release-readiness-20260805`
- สถานะ: **Merged**
- Main merge commit: `c6084dc1e24fe36169d393b02b3954cb98ca359f`

P8 เป็น Release gate และไม่สร้าง Owner ซ้ำกับ P1–P7

## Ownership boundary

- P2: Role, Team, Effective access, Scope, Limit และ DENY
- P3: Workspace selection และ Navigation visibility
- P4: Chart, Widget และ Dashboard interaction
- P5: Table, Form และ Drawer
- P6: `/settings` และ `/system-settings`
- P7: Design-system ownership และ CSS cleanup
- P8: Sensitive-action policy, Accessibility, Browser coverage, Resilience, Performance และ Release evidence

## Route closure

- Route inventory มี Permission และ Workspace owner
- `/system-settings` และ nested routes ใช้ Settings workspace
- `/settings/activities` ใช้ `settings.features.view`
- Specific nested route ชนะ Parent route ด้วย longest-prefix ordering
- Unknown route ถูกปฏิเสธแม้ Admin มี wildcard `*`
- Protected layout ใช้ `canAccessPath()` owner กลางแบบ fail-closed
- Source contracts ป้องกันสูตร permission ซ้ำและ Route หลุด Registry

## Sensitive-action runtime policy

Policy กลางรองรับ:

- Permission หรือ wildcard authority
- Step-up evidence ผูกกับ Admin และ Session เดียวกัน
- Step-up freshness และ clock-skew validation
- เหตุผลขั้นต่ำสำหรับ Sensitive action
- Single/Dual approval contract
- Deduplicate approver
- No requester self-approval
- No target self-approval
- Wildcard ไม่ข้าม Step-up, Reason หรือ Approval
- Fail closed เมื่อ Policy ไม่ผ่าน

Runtime integration:

- `PermissionsGuard` เรียก P8 policy สำหรับ sensitive P2/P6 mutations
- P2 permission override, access profile, role/status/delegation และ session mutations ใช้ Actor, Session, Target และ Reason จาก request จริง
- Settings และ System Settings sensitive mutations ใช้ permission และ session evidence โดยไม่พึ่ง client header เพียงอย่างเดียว
- Ownership Transfer เรียก `AdminAuthService.assertStepUp()` ก่อน transaction
- Ownership Step-up รองรับ TOTP และ Recovery code
- Ownership evidence ผูก `actorAdminUserId` และ `actorSessionId` เดียวกับ request
- Ownership audit อยู่ transaction เดียวกับ Role transfer

Sensitive audit evidence:

- เก็บ Action, Permission, Actor, Session, Requester, Target และ Approver IDs
- เก็บ Step-up method/time
- เก็บเฉพาะชื่อ Field ที่เปิดเผยและเวลา Expiry
- ไม่รับหรือบันทึก Secret value

Canonical files:

- `apps/api/src/common/admin-sensitive-action-policy.ts`
- `apps/api/src/common/admin-sensitive-action-enforcement.ts`
- `apps/api/src/common/guards/permissions.guard.ts`
- `apps/api/src/modules/admin-access/admin-ownership-command.service.ts`
- `apps/api/src/modules/admin-access/admin-access-session.service.ts`

## Accessibility และ interaction

Routes หลักใน P8 coverage:

- `/system-settings`
- `/settings/activities`
- `/activity-center`
- `/admin-invitations`
- `/security?tab=sessions`
- `/security?tab=two-factor`

Coverage:

- Main, Heading และ Link landmarks
- Keyboard focus และ visible focus target
- Form control มี Label หรือ ARIA name
- Reduced motion และ forced colors
- WCAG text spacing
- Long admin name/role บน Desktop, Tablet และ Mobile
- Responsive Drawer อยู่ในขอบ Viewport
- 200% desktop-equivalent reflow
- Drawer และ ConfirmDialog มี Focus trap, Escape, Scroll lock และ Focus restore
- Empty state มี semantic heading
- Invitation Data Table รองรับ Keyboard pagination และ Desktop table/Mobile card
- Security Tabs รักษา Query parameter และ `aria-current`
- Session destructive confirm ยกเลิกได้โดยไม่ยิง Mutation
- 2FA secret แสดงและล้างจากหน้าจอผ่าน Security owner
- Dataset ยาวและ User-Agent ยาวไม่ทำให้ Page overflow

## Persona และ Release matrix

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
- Role codes ใช้ Template จริงจาก P2
- Multi-role ใช้ Permission union
- Explicit DENY ชนะแบบ fail-closed

PR #622 เพิ่ม authenticated disposable-staging acceptance บน matrix นี้และเป็น canonical final acceptance owner หลัง PR #608 ถูก supersede

## Session และ Network resilience

- 401 refresh ได้หนึ่งครั้ง
- Retry แล้วยัง 401 ต้องกลับ Login
- 403 ไม่ทำลาย Session
- 2FA-required ไม่วน Redirect
- Request timeout 15 วินาที
- Read-only request retry ได้หนึ่งครั้งเฉพาะ Network/Timeout และ 408/425/429/502/503/504
- `Retry-After` ถูกจำกัด
- Mutation, 401, 403 และ Caller cancellation ไม่ถูก retry อัตโนมัติ
- Offline Security data ถูกล้างแบบ fail-closed ไม่แสดงข้อมูล stale
- Reconnect แล้ว Refresh โหลดข้อมูลใหม่โดยไม่สร้าง Login loop

## Browser coverage

- Chromium Desktop 1440×900
- Chromium Tablet 834×1112
- Chromium Mobile 390×844
- Firefox Desktop
- WebKit Desktop
- Route, Persona, Reflow, Data resilience และ Owner interaction evidence

## Performance gate

Production bundle gate อ่าน Build manifest และวัด gzip จากไฟล์จริง:

- Route budget: 220 KB gzip
- Chunk budget: 160 KB gzip
- `pnpm analyze` รัน production build แล้วบังคับ budget
- Admin Verification เก็บ bundle evidence เป็น Artifact

PR #622 เพิ่ม runtime performance budgets ใน authenticated staging เพื่อให้ bundle budget และ runtime transfer budgetตรวจคนละชั้น

## Definition of Done

- [x] Route inventory มี Permission และ Workspace owner
- [x] Unknown routes fail closed
- [x] Sensitive P2/P6 mutations เรียก P8 policyจริง
- [x] Ownership Transfer ใช้ fresh Step-up และ session binding
- [x] `/security` ใช้ Owner เดิมสำหรับ Session, 2FA, Recovery และ Step-up
- [x] Tier 0 ผ่าน Security, Accessibility และ Browser coverage ตาม Persona และ Viewport
- [x] Performance budget ผ่านจาก production assets
- [x] Required CI ผ่านบน Head เดียวกัน
- [x] Merge เข้า `main` และยืนยัน commit `c6084dc1e24fe36169d393b02b3954cb98ca359f`

Canonical cross-domain handoff: `docs/admin-operations-handoff.md`.
