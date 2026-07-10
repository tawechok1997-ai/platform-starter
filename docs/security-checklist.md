# Security Checklist

รายการตรวจความปลอดภัยก่อนปล่อย production

## Environment

- `DATABASE_URL` อยู่เฉพาะ service ที่ต้องใช้
- `JWT_ACCESS_KEY` ไม่ใช้ค่า default
- `ADMIN_JWT_ACCESS_TTL` สั้นพอ เช่น 5m-10m
- `ADMIN_REFRESH_TTL_HOURS` ไม่ยาวเกินจำเป็น
- `JWT_REFRESH_TTL_DAYS` เหมาะกับ member session
- `NEXT_PUBLIC_API_URL` ชี้ API service จริง
- ไม่ commit secret ลง repo

## Auth

- Member protected pages ต้อง verify session
- Admin protected pages ต้อง verify session
- Access token หมดอายุแล้ว refresh ได้
- Refresh token เสียต้อง clear session
- Logout ต้องลบ access/refresh token

## Admin

- Admin login มี rate limit
- Admin routes ใช้ permission guard
- Permission wildcard ใช้เฉพาะ super admin
- Money actions ต้องมี audit log
- Topup/withdraw ต้อง claim ก่อน action

## Money operation

- Approve topup ต้อง idempotent
- Reject/complete withdrawal ต้องไม่ทำซ้ำ
- Withdrawal reject ต้องคืน locked balance
- Wallet balance ต้องตรงกับ latest ledger
- Risk Alerts ควรเช็กเป็นประจำ

## Uploads

- Slip upload เก็บ private storage
- Admin อ่าน slip ผ่าน protected endpoint
- ไม่ expose private file path ตรง ๆ

## API hardening

- Security headers เปิดอยู่
- Request logging มี requestId
- Error response มี requestId
- Sensitive route มี rate limit
- Production CORS ต้องจำกัด origin

## Database

- ห้ามใช้ `pnpm prisma db push --force-reset` บน production
- Backup ก่อน deploy ใหญ่
- Restore drill อย่างน้อยเดือนละครั้ง
- ตรวจ migrations/schema sync ก่อนปล่อย

## Incident response

เมื่อเจอ error production:

1. ขอเวลาและ requestId
2. เปิด Railway logs
3. ตรวจ `/health`
4. ตรวจ `/version`
5. ดู error จาก API
6. Rollback ถ้าเป็น deploy ล่าสุด

อย่าแก้ production แบบเดาสุ่ม เพราะนั่นไม่ใช่ DevOps นั่นคือไสยศาสตร์พร้อม keyboard
