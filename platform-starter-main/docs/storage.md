# Private Slip Storage

ระบบสลิปเติมเงินใช้ storage layer กลางผ่าน `StorageService` เพื่อให้ dev ใช้ local disk ได้ และ production ใช้ S3-compatible storage เช่น Cloudflare R2 ได้

## Local storage

ค่าเริ่มต้นคือ local storage

```env
STORAGE_DRIVER=local
PRIVATE_MEDIA_DIR=/app/private-media/topup-slips
```

บน Railway ให้ mount volume ไปที่ path เดียวกับ `PRIVATE_MEDIA_DIR` หากยังใช้ local storage อยู่

ตัวอย่าง key ใหม่ของสลิป:

```txt
slips/2026-07-08/<uuid>.jpg
```

เมื่อใช้ local storage ไฟล์จะถูกเก็บใต้:

```txt
$PRIVATE_MEDIA_DIR/slips/YYYY-MM-DD/<uuid>.<ext>
```

## S3 / Cloudflare R2

ตั้งค่า env:

```env
STORAGE_DRIVER=s3
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=<bucket-name>
S3_ACCESS_KEY_ID=<access-key-id>
S3_SECRET_ACCESS_KEY=<secret-access-key>
S3_FORCE_PATH_STYLE=true
```

สำหรับ AWS S3 ทั่วไปให้ใช้ endpoint/region ของ AWS และปรับ `S3_FORCE_PATH_STYLE` ตาม provider

## Security

- ไม่เปิด public URL สำหรับ slip
- Admin อ่านสลิปผ่าน protected endpoint เดิมเท่านั้น
- Endpoint อ่านสลิปคือ `GET /admin/topups/:id/slip`
- Member upload slip ผ่าน `POST /member/topups/slip`

## Rollout checklist

1. ตั้งค่า env ใน API service
2. ถ้าใช้ local ให้ mount volume และตั้ง `PRIVATE_MEDIA_DIR`
3. ถ้าใช้ R2/S3 ให้สร้าง bucket และ access key
4. Redeploy API
5. อัปโหลด slip ใหม่จาก member
6. เปิด `/topups` แล้วกดดู slip preview ใน admin
7. ทดสอบ approve/reject top-up

## Legacy slips

สลิปเดิมที่เก็บแบบ local legacy ยังอ่านได้เมื่อ `PRIVATE_MEDIA_DIR` ชี้ไป folder เดิม เพราะระบบจะลองหาไฟล์รูปจาก `slipFileId` เดิมพร้อมนามสกุล `jpg/png/webp/jpeg`

ถ้าย้ายจาก local ไป R2/S3 สลิปเก่าจะไม่ถูกย้ายอัตโนมัติ ต้อง migrate ไฟล์เก่าเข้า bucket เองหากต้องการดูย้อนหลัง
