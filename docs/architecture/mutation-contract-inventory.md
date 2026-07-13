# Mutation Contract Inventory

เอกสารนี้กำหนด baseline สำหรับ `POST`, `PUT`, `PATCH` และ `DELETE` ใน API ก่อน refactor เชิงโครงสร้าง

## Policy

1. Critical mutation ต้องใช้ request type ที่ตั้งชื่อชัดเจน เช่น `Dto`, `Request`, `Command` หรือ `Input`
2. ห้ามใช้ `@Body() body: any` ใน critical modules
3. Inline object body ยังอนุญาตชั่วคราวเพื่อ migration แต่ต้องถูกแสดงใน audit output
4. Bodyless mutation อนุญาตได้เมื่อ contract ไม่ต้องรับ payload
5. DTO ต้องรับผิดชอบ validation, normalization, enum whitelist และ length limit ตามความเสี่ยงของ route

## Critical modules

- `admin-access`
- `admin-auth`
- `finance`
- `withdrawals`
- `risk-alerts`
- `support`
- `promotions`
- `game-platform`

## CI command

```bash
pnpm audit:mutation-dto-coverage
```

CI จะ fail เมื่อ critical mutation มี request body แต่ไม่มี named request type หรือยังใช้ `any`

Inline object bodies จะถูกเตือนเพื่อทำ migration ต่อใน R-004 โดยไม่บล็อกงานปัจจุบันทั้งหมดพร้อมกัน

## Migration order

1. Money movement และ settlement
2. Admin ownership/account lifecycle
3. KYC/watchlist override
4. Support lifecycle
5. Provider configuration/webhook operations
6. Remaining non-critical controllers

## Definition of Done

- Critical mutation ทุก route ใช้ named DTO/request contract
- Inline object body ใน critical modules เป็นศูนย์
- ไม่มี `@Body() ...: any`
- DTO มี validation และ normalization ที่เหมาะสม
- Frontend contract ไม่ต้อง parse error message เพื่อเดาสถานะ
