# API Rate Limits

API มี rate limit สำหรับ endpoint สำคัญ เช่น login, register, top-up, slip upload และ withdrawal

## Storage backend

ถ้าตั้ง `REDIS_URL` ระบบจะใช้ Redis เป็น shared rate limit store เหมาะกับ production ที่มีหลาย API instance

ถ้าไม่ตั้ง `REDIS_URL` ระบบจะ fallback เป็น memory rate limit ภายใน process เดียว เหมาะกับ local dev เท่านั้น

```env
REDIS_URL=redis://default:<password>@<host>:<port>
```

## Default limits

ทุก limit เป็นจำนวน request ต่อ 1 นาที ต่อ IP ต่อ endpoint

```env
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_MEMBER_LOGIN_PER_MINUTE=10
RATE_LIMIT_MEMBER_REGISTER_PER_MINUTE=8
RATE_LIMIT_ADMIN_LOGIN_PER_MINUTE=10
RATE_LIMIT_ADMIN_2FA_PER_MINUTE=10
RATE_LIMIT_ADMIN_REFRESH_PER_MINUTE=30
RATE_LIMIT_TOPUPS_PER_MINUTE=20
RATE_LIMIT_SLIP_UPLOAD_PER_MINUTE=12
RATE_LIMIT_WITHDRAWALS_PER_MINUTE=12
```

ถ้าไม่ตั้ง env เฉพาะ endpoint จะใช้ค่า default ใน code

## Protected endpoints

- `POST /auth/login`
- `POST /auth/register`
- `POST /admin/auth/login`
- `POST /admin/auth/2fa/verify`
- `POST /admin/auth/refresh`
- `POST /member/topups`
- `POST /member/topups/slip`
- `POST /member/withdrawals`

## Behavior

เมื่อเกิน limit API จะตอบ:

```http
429 Too Many Requests
Retry-After: <seconds>
```

body:

```json
{
  "message": "Too many requests",
  "requestId": "..."
}
```

## Rollout checklist

1. เพิ่ม Redis service ใน production
2. ตั้ง `REDIS_URL` ใน API service
3. ตั้งค่า limit เฉพาะ endpoint ตามความเสี่ยง
4. Redeploy API
5. ยิง login ผิดหลายครั้งเพื่อทดสอบ 429
6. เช็ก log ว่าไม่มี `redis connect failed`

## Notes

- Memory fallback ยังทำงานได้ แต่ไม่ shared ระหว่างหลาย instance
- Redis key prefix คือ `rate:`
- Window คงที่ 60 วินาที
- Rate limit แยกตาม method + path + client IP
