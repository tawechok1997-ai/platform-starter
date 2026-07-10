# Admin 2FA Recovery Codes

Recovery codes ใช้เป็นรหัสสำรองสำหรับ admin ที่เปิด 2FA แล้วไม่สามารถใช้แอป Authenticator ได้ เช่น มือถือหาย ย้ายเครื่อง หรือแอป OTP ถูกลบ

## Behavior

- ตอนเปิด 2FA สำเร็จ ระบบจะสร้าง recovery codes 10 อัน
- Recovery codes แสดงให้ admin เห็นครั้งเดียวเท่านั้น
- DB เก็บเฉพาะ hash ของ code ด้วย Argon2
- แต่ละ code ใช้ได้ครั้งเดียว
- เมื่อใช้ code แล้ว ระบบจะ mark `usedAt`
- Admin สามารถ regenerate recovery codes ชุดใหม่ได้จากหน้า `/security`
- เมื่อ regenerate สำเร็จ ชุดเก่าทั้งหมดจะถูกลบทิ้งและใช้ไม่ได้ทันที
- Admin สามารถ deactivate 2FA จากหน้า `/security` ได้หลังยืนยันด้วย TOTP หรือ recovery code ปัจจุบัน
- เมื่อ deactivate 2FA สำเร็จ ระบบจะลบ secret และ recovery codes ทั้งหมด

## Database

Model:

```prisma
model AdminRecoveryCode {
  id          String    @id @default(uuid()) @db.Uuid
  adminUserId String    @map("admin_user_id") @db.Uuid
  codeHash    String    @map("code_hash")
  usedAt      DateTime? @map("used_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  adminUser AdminUser @relation(fields: [adminUserId], references: [id], onDelete: Cascade)

  @@index([adminUserId])
  @@index([usedAt])
  @@map("admin_recovery_codes")
}
```

ต้องรัน schema update:

```bash
pnpm prisma db push
pnpm prisma generate
```

ห้ามใช้ `--force-reset` กับ production เพราะจะล้าง DB

## Endpoints

### Enable 2FA

```http
POST /admin/auth/2fa/enable
```

Body:

```json
{
  "code": "123456"
}
```

Response:

```json
{
  "success": true,
  "recoveryCodes": ["ABCD-EFGH-IJKL"]
}
```

### Verify 2FA login

```http
POST /admin/auth/2fa/verify
```

Body supports either TOTP or recovery code:

```json
{
  "challengeId": "admin-user-id",
  "code": "123456"
}
```

or:

```json
{
  "challengeId": "admin-user-id",
  "code": "ABCD-EFGH-IJKL"
}
```

### Regenerate recovery codes

```http
POST /admin/auth/2fa/recovery-codes/regenerate
```

Requires admin auth session.

Body supports current TOTP or a current unused recovery code:

```json
{
  "code": "123456"
}
```

Response:

```json
{
  "success": true,
  "recoveryCodes": ["ABCD-EFGH-IJKL"]
}
```

### Deactivate 2FA

```http
POST /admin/auth/2fa/disable
```

Requires admin auth session.

Body supports current TOTP or a current unused recovery code:

```json
{
  "code": "123456"
}
```

Response:

```json
{
  "success": true
}
```

Effect:

- `twoFactorEnabled = false`
- `twoFactorSecret = null`
- all recovery codes for that admin are deleted

## Audit logs

Events:

- `admin.recovery_codes.generate`
- `admin.recovery_codes.regenerate`
- `admin.recovery_codes.use`
- `admin.otp.disable`

## QA checklist

1. Run DB update

```bash
pnpm prisma db push
pnpm prisma generate
```

2. Build

```bash
pnpm build:api
pnpm build:web-admin
```

3. Enable 2FA from `/security`

Expected:

- QR still works
- Enter 6-digit code
- Recovery codes appear once
- Audit log records generate event

4. Login using TOTP

Expected:

- Login succeeds

5. Login using recovery code

Expected:

- Login succeeds
- Code is marked used
- Same recovery code cannot be reused
- Audit log records use event

6. Regenerate recovery codes

Expected:

- Requires current TOTP or unused recovery code
- New codes appear once
- Old codes no longer work
- Audit log records regenerate event

7. Deactivate 2FA

Expected:

- Requires current TOTP or unused recovery code
- 2FA status is updated
- Recovery codes are cleared
- Future login should not require 2FA
- Audit log records disable event
