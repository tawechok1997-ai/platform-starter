# Admin Redesign P3: Navigation และ Role-aware Dashboard

Branch: `agent/admin-phase-3-navigation-dashboard`

Base: latest `main`

Status: เริ่มทำแบบขนานกับ P2 โดยใช้สัญญาเชื่อมต่อแทนการ import database model ของ P2

## เป้าหมาย

- Navigation registry กลางสำหรับ Sidebar, Favorites, Recent และ Command Palette
- Workspace 5 แบบ: การเงิน, ฝากถอน, การตลาด, หัวหน้า และคนดูแลระบบ
- ผู้ใช้หลายตำแหน่งเห็นเมนูจากทุก Workspace ที่ได้รับ
- ตำแหน่งหลักกำหนด Dashboard เริ่มต้น
- Profile แสดงทุก Workspace ที่ได้รับ
- Permission guard เดิมยังเป็นด่านสุดท้ายเสมอ
- ไม่มีเมนูเก่าและใหม่ซ้ำกัน

## ขอบเขตที่เริ่มแล้ว

- เพิ่ม `admin-workspace-registry.ts` เป็น owner ของ Workspace metadata
- เพิ่มตัวแก้ primary Workspace และ Dashboard key
- เพิ่มตัวรวม nav group สำหรับผู้ใช้หลายตำแหน่ง
- เพิ่ม contract test เพื่อยืนยัน Workspace ครบ 5 แบบ
- แยก P3 ออกจาก P2 database authority เพื่อให้สอง PR ทำงานพร้อมกันได้

## สัญญากับ P2

P2 ต้องส่งข้อมูลเข้ารูปแบบต่อไปนี้:

```ts
type AdminWorkspaceAssignment = {
  workspaceId: 'finance' | 'payments' | 'growth' | 'manager' | 'system';
  primary?: boolean;
  enabled?: boolean;
};
```

P3 จะไม่สร้าง Role, Permission override, Team hierarchy หรือฐานข้อมูลซ้ำกับ P2

## งานถัดไป

1. เชื่อม Workspace registry เข้ากับ `admin-nav.ts`
2. ให้ Sidebar, Favorites, Recent และ Command Palette อ่านผลลัพธ์ชุดเดียวกัน
3. เพิ่ม Workspace switcher สำหรับผู้ใช้หลายตำแหน่ง
4. เพิ่ม Dashboard resolver และ dashboard composition ต่อ Workspace
5. อัปเดต Profile ให้แสดงทุกตำแหน่ง
6. ลบ route/menu owner เดิมที่ซ้ำหลังตรวจ regression
7. เพิ่ม Desktop, Tablet และ Mobile contract tests

## เงื่อนไขก่อน Merge

- P2 mapping contract ต้องตรงกับ Workspace IDs ของ P3
- ไม่มีการลด permission guard ของ Route
- Build, Typecheck, Unit, Full-system และ Admin capability audit ผ่าน
- ตรวจว่า P2 และ P3 ไม่แก้ owner เดียวกันแบบขัดแย้ง
