# Provider Simulator

ระบบนี้จำลอง API ของค่ายเกมแบบ transfer wallet เพื่อทดสอบการโยกเงินระหว่างเว็บกับค่าย, การ sync รายชื่อเกม, รูปไอคอน, launch URL, balance และ idempotency โดยไม่เชื่อมเงินจริงภายนอก

## เปิดใช้งาน

ตั้งค่าใน API environment:

```env
ENABLE_PROVIDER_SIMULATOR=true
API_PUBLIC_URL=http://localhost:4000
PROVIDER_SIMULATOR_API_KEY=simulator-api-key
PROVIDER_SIMULATOR_MERCHANT_ID=simulator-merchant
PROVIDER_SIMULATOR_SECRET=simulator-secret
```

ห้ามเปิด `ENABLE_PROVIDER_SIMULATOR=true` ใน production จริง

## Provider ที่ต้องสร้างใน Admin

ใช้ provider code:

```text
provider-simulator
```

ใช้ adapter code เดียวกัน และตั้งค่า currency เป็น `THB`

### Credentials

| Key | Value สำหรับ local |
|---|---|
| `API_KEY` | `simulator-api-key` |
| `MERCHANT_ID` | `simulator-merchant` |
| `SECRET_KEY` | `simulator-secret` |
| `WEBHOOK_SECRET` | `simulator-secret` |

### Endpoint map

เมื่อ API อยู่ที่ `http://localhost:4000`:

| Endpoint key | URL |
|---|---|
| `HEALTH_CHECK` | `http://localhost:4000/provider-simulator/health` |
| `LAUNCH` | `http://localhost:4000/provider-simulator/launch` |
| `BALANCE` | `http://localhost:4000/provider-simulator/balance` |
| `TRANSFER_IN` | `http://localhost:4000/provider-simulator/transfer-in` |
| `TRANSFER_OUT` | `http://localhost:4000/provider-simulator/transfer-out` |
| `GAME_LIST` | `http://localhost:4000/provider-simulator/games` |
| `BET_HISTORY` | `http://localhost:4000/provider-simulator/bet-history` |

ตั้ง timeout ประมาณ 5,000–10,000 ms แล้วเปิด provider ใน non-production เท่านั้น

## Flow ทดสอบ

1. เปิด simulator และสร้าง provider ตามค่าด้านบน
2. ใช้หน้า Adapter Test ทดสอบ health
3. กด Sync Games
4. ตรวจว่าชื่อเกม, category, imageUrl และ iconUrl ถูกบันทึก
5. เปิดหน้า Member Games และตรวจว่าเกมกับไอคอน SVG แสดงผล
6. Transfer-in 100.00 บาท
7. ตรวจ provider balance ต้องเป็น 100.00
8. ส่ง transfer-in ซ้ำด้วย idempotency key เดิม ยอดต้องยังเป็น 100.00
9. Transfer-out 35.50 บาท
10. ตรวจ provider balance ต้องเหลือ 64.50
11. ส่ง transfer-out เกินยอด ต้องถูกปฏิเสธและยอดต้องไม่เปลี่ยน
12. ตรวจ WalletLedger และ GameTransfer ฝั่งแพลตฟอร์มว่าตรงกับยอด simulator
13. รัน reconciliation ให้ expected balance ตรงกับ provider balance

## Game catalog

Simulator ส่งเกมตัวอย่าง 8 เกมพร้อมชื่อ, category และไอคอน SVG ที่เสิร์ฟจาก API จริง เช่น:

```text
/provider-simulator/icons/fortune-tiger.svg
```

รูปเหล่านี้เป็น asset ที่สร้างภายในโปรเจกต์เพื่อทดสอบการดึงและแสดงภาพจริงผ่าน HTTP ไม่ใช่โลโก้หรือทรัพย์สินของค่ายภายนอก

## Safety behavior

- ทุก endpoint ตรวจ API key, merchant ID, timestamp และ HMAC-SHA256
- timestamp เก่าเกิน 5 นาทีถูกปฏิเสธ
- idempotency key เดิมพร้อมข้อมูลเดิมคืนผลเดิมโดยไม่เปลี่ยนยอดซ้ำ
- idempotency key เดิมแต่จำนวนเงินหรือผู้ใช้ต่างกันถูกปฏิเสธ
- transfer-out เกินยอดถูกปฏิเสธ
- simulator ถูกปิดเป็นค่าเริ่มต้นและ route จะตอบ 404 เมื่อไม่ได้เปิด
- balance และ transfer records อยู่ใน memory จึง reset เมื่อ API restart เหมาะสำหรับ local/CI เท่านั้น

## Automated test

```bash
pnpm --filter @platform/api exec jest provider-simulator.service.spec.ts --runInBand
```

ชุดทดสอบครอบคลุม transfer-in, transfer-out, balance, retry idempotency, overdraft, HMAC และ game icon catalog
