# Mobile QA Checklist

ใช้เช็กหลัง deploy ทุกครั้งที่แก้ UI ฝั่ง member หรือ admin

## Devices

- iPhone Safari
- Android Chrome ถ้ามี
- Desktop responsive mode ใช้ช่วยได้ แต่ห้ามแทนเครื่องจริงทั้งหมด

## Global checks

- ไม่มี horizontal scroll
- card ไม่ล้นขอบจอ
- input/select/date ไม่ล้น
- ปุ่มไม่ซ้อนกัน
- font ไม่เล็กเกินไป
- tap target กดง่าย
- drawer/menu เปิดปิดได้
- long text, UUID, metadata ไม่ดัน layout แตก

## Member pages

- `/login`
- `/register`
- `/`
- `/deposit`
- `/withdraw`
- `/transactions`
- `/bank-accounts`

### Member auth

- login card อยู่กลาง
- register card อยู่กลาง
- password eye toggle ใช้ได้
- ไม่มี token แล้วเข้า protected page ต้องเด้ง login
- login สำเร็จแล้วเข้า dashboard ได้

### Member money flow

- deposit amount buttons ไม่ล้น
- deposit method buttons ไม่ล้น
- QR/slip preview ไม่ล้น
- withdraw wallet amount ไม่ล้น
- bank account select ยาว ๆ ไม่ดันจอ
- transaction amount/ref ไม่ล้นขวา

## Admin pages

- `/login`
- `/dashboard`
- `/finance`
- `/topups`
- `/withdrawals`
- `/members`
- `/members/:id`
- `/risk-alerts`
- `/risk-alerts/:id`
- `/settings`
- `/reports`
- `/bank-accounts`

### Admin auth

- login card อยู่กลาง
- password eye toggle ใช้ได้
- ไม่มี token แล้วเข้า dashboard/settings/members/risk-alerts ไม่ได้

### Admin operation

- drawer scroll ได้
- queue buttons ไม่เบียด
- filters ไม่ล้น
- date input ไม่ล้น
- metadata/pre scroll ได้
- action buttons wrap ดี

## Bug report format

ส่ง screenshot พร้อมข้อมูลนี้:

```txt
Page:
Device:
Browser:
What broke:
Expected:
```

ตัวอย่าง:

```txt
Page: /risk-alerts
Device: iPhone
Browser: Safari
What broke: From/To date input ล้นขวา
Expected: input อยู่ใน card
```
