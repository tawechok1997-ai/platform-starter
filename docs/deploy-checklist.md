# Deploy Checklist

ใช้เช็กก่อนและหลัง deploy ทุกครั้ง

## ก่อน deploy

- [ ] อ่าน commit ล่าสุดว่ามี Prisma schema เปลี่ยนไหม
- [ ] ถ้ามี Prisma schema เปลี่ยน ให้รัน `pnpm prisma db push`
- [ ] รัน `pnpm prisma generate`
- [ ] รัน build ที่เกี่ยวข้อง

```bash
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
```

- [ ] ห้ามใช้ `pnpm prisma db push --force-reset`
- [ ] ตรวจ env ว่า frontend ชี้ API ถูก service

```env
NEXT_PUBLIC_API_URL=https://api-service.up.railway.app
```

## Deploy order

1. API
2. Web Admin
3. Web Member

## หลัง deploy API

- [ ] เปิด `/health`
- [ ] เปิด `/version`
- [ ] ตรวจ Railway logs ไม่มี crash loop
- [ ] ตรวจ database status เป็น ok
- [ ] ตรวจ privateMedia status เป็น ok

## หลัง deploy Web Admin

- [ ] Login admin ได้
- [ ] Dashboard โหลดได้
- [ ] Settings ไม่ขึ้น Permission denied
- [ ] Topups queue โหลดได้
- [ ] Withdrawals queue โหลดได้
- [ ] Risk Alerts โหลดได้
- [ ] Scan now ใช้ได้

## หลัง deploy Web Member

- [ ] Login member ได้
- [ ] Wallet แสดงได้
- [ ] Deposit flow โหลดบัญชีรับเงินได้
- [ ] Upload slip ได้
- [ ] Withdraw page โหลดบัญชี approved ได้

## Smoke test commands

```bash
curl https://api-service.up.railway.app/health
curl https://api-service.up.railway.app/version
```

Admin API endpoint ต้องใช้ Authorization header:

```bash
curl -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  https://api-service.up.railway.app/admin/risk-alerts?status=OPEN
```

## Rollback trigger

Rollback ถ้าเจออย่างใดอย่างหนึ่ง:

- API crash loop
- Login ทั้ง admin/member ใช้ไม่ได้
- Topup/withdraw create request ไม่ได้
- Wallet balance ผิดปกติ
- Prisma error จากตารางหายหลัง db push แล้วแก้ไม่ได้เร็ว

## Notes

ถ้า error เกี่ยวกับ token expired แต่ refresh สำเร็จ ถือว่าปกติ:

```txt
GET /admin/... 401
POST /admin/auth/refresh 201
GET /admin/... 200
```
