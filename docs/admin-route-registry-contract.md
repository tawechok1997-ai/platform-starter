# Admin Route Registry Contract

สถานะ: implementation contract สำหรับ `apps/web-admin`

เอกสารนี้อธิบาย registry schema ที่ใช้บังคับข้อกำหนดใน [`admin-complete-route-coverage-spec.md`](./admin-complete-route-coverage-spec.md) ผ่านคำสั่ง:

```bash
pnpm --filter @platform/web-admin inventory:admin-routes
```

ผลลัพธ์ถูกสร้างที่ `docs/admin-route-registry.generated.json` และอัปโหลดเป็น CI artifact โดย workflow `Admin Route Inventory`

## ข้อมูลบังคับต่อ route

ทุก `page.tsx`, `page.ts`, `page.jsx` และ `page.js` ภายใต้ `apps/web-admin/app` ต้องมีข้อมูลต่อไปนี้ใน generated registry:

- Route และ source file
- Route type
- Workspace owner และ parent route
- Minimum permission และแหล่งที่มาของ policy
- Primary task
- API/data sources
- Desktop และ Mobile pattern
- Localization namespace พร้อมภาษาไทยและอังกฤษ
- Required system states
- Unit, interaction, smoke, visual และ permission test evidence
- Legacy/compatibility behavior
- Verification status และ contract findings

## แหล่งข้อมูล

Registry ไม่เก็บ metadata ซ้ำแบบ manual 88 แถว แต่ประกอบข้อมูลจาก source of truth ที่มีอยู่แล้ว:

- Workspace ownership, canonical route และ mobile pattern จาก `src/features/admin-modernization/workspaces.ts`
- Minimum permissions จาก `app/(admin)/admin-nav.ts`
- API endpoints และ UI pattern จาก route source graph
- Local unit tests จากไฟล์ `.spec.ts` และ `.spec.tsx` ที่อยู่ใกล้ source graph
- Cross-route smoke, visual และ permission evidence จาก CI workflows ที่มีอยู่

## Fail-closed rules

คำสั่งและ CI ต้อง fail เมื่อพบอย่างน้อยหนึ่งกรณี:

- Route ซ้ำ
- Route ไม่มี Workspace owner
- Route ไม่ได้ลงทะเบียน permission ใน `admin-nav.ts`
- Primary task, data source หรือ localization namespace ว่าง
- Dynamic detail route ไม่มี `not-found`, `deleted` หรือ `stale` state
- หมวด test coverage ใดไม่มี evidence

Authentication routes ใช้ policy `public` ส่วน safe self-service routes ใช้ `authenticated-admin:self-service` Route อื่นต้อง resolve permission จาก `requiredPermissionsForPath()` เท่านั้น

## การเพิ่ม route ใหม่

1. เพิ่ม route implementation
2. เพิ่ม prefix/workspace owner เมื่อเป็นกลุ่มใหม่
3. ลงทะเบียน minimum permission ใน `admin-nav.ts`
4. เพิ่ม route-specific task หรือ editor/utility classification เมื่อ default ไม่สื่อความหมาย
5. รัน inventory command และตรวจ generated artifact
6. เพิ่ม local regression test เมื่อ route มี interaction เฉพาะ

Route ใหม่ห้าม Merge หาก registry status เป็น `implementing` หรือมี contract finding คงค้าง
