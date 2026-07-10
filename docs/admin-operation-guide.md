# Admin Operation Guide

คู่มือใช้งานหลังบ้านสำหรับงานประจำวัน

## Daily flow

1. เปิด `/dashboard`
2. เช็ก pending topups
3. เช็ก pending withdrawals
4. เช็ก risk alerts
5. เปิด `/finance` เพื่อตรวจภาพรวมยอดเงิน
6. เปิด `/reports` เพื่อตรวจรายงานประจำวัน

## Top-up review

หน้า: `/topups`

ขั้นตอน:

1. กด Claim รายการก่อนตรวจ
2. เปิดดูสลิป
3. ตรวจยอดเงิน วิธีชำระ และบัญชีรับเงิน
4. ถ้าถูกต้อง กด Approve
5. ถ้าไม่ถูกต้อง กด Reject พร้อม note

ข้อควรระวัง:

- อย่า approve ถ้ายอดไม่ตรง
- อย่า approve ถ้า slip ไม่ชัด
- ถ้ารายการถูก claim โดยคนอื่น ให้รอหรือให้เจ้าของ release

## Withdrawal review

หน้า: `/withdrawals`

ขั้นตอน:

1. กด Claim รายการก่อนตรวจ
2. ตรวจชื่อบัญชี เลขบัญชี ธนาคาร และยอดเงิน
3. โอนเงินจริงนอกระบบ
4. กด Complete หลังโอนสำเร็จแล้วเท่านั้น
5. ถ้าปฏิเสธ กด Reject เพื่อคืน locked balance

ข้อควรระวัง:

- Complete จะกระทบยอดเงินจริง
- Reject จะคืนยอด locked balance
- ตรวจ Risk Alerts ก่อนทำรายการยอดสูง

## Risk Alerts

หน้า: `/risk-alerts`

ใช้ดูความเสี่ยง เช่น:

- เติมเงินถี่ผิดปกติ
- ฝากแล้วถอนเร็ว
- ถอนยอดสูง
- เปลี่ยนบัญชีแล้วถอนเร็ว
- wallet balance ไม่ตรง ledger

Workflow:

1. OPEN = ยังไม่ตรวจ
2. REVIEWING = กำลังตรวจ
3. RESOLVED = ตรวจแล้วจบเคส
4. DISMISSED = ไม่ใช่ปัญหา

## Member management

หน้า: `/members`

ใช้สำหรับ:

- ค้นหาสมาชิก
- ดู wallet
- ดู ledgers
- ดู topups/withdrawals ล่าสุด
- Suspend/Lock/Active account

ข้อควรระวัง:

- Suspend/Lock มีผลกับบัญชีสมาชิกจริง
- ตรวจ activity และ risk ก่อนปลด lock

## Settings

หน้า: `/settings`

ใช้ตั้งค่า:

- Website
- Branding
- Theme
- SEO
- Contact
- Maintenance
- Scripts
- Feature Flags
- Legal Pages

ก่อนแก้ setting สำคัญควรจดค่าเดิมไว้เสมอ เพราะมนุษย์ชอบกดผิดแล้วบอกว่าเว็บทำเอง
