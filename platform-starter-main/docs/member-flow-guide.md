# Member Flow Guide

คู่มือ flow ฝั่งสมาชิก

## Auth

### Login

หน้า: `/login`

- กรอก username / phone / email
- กรอก password
- ใช้ปุ่ม eye toggle เพื่อแสดง/ซ่อน password
- login สำเร็จแล้วไปหน้า `/`

### Register

หน้า: `/register`

- กรอก username
- กรอก phone
- email ไม่บังคับ
- กรอก password
- สมัครสำเร็จแล้วเข้าสู่ระบบอัตโนมัติ

## Dashboard

หน้า: `/`

ควรเห็น:

- wallet balance
- quick actions
- banner/ประกาศ ถ้ามี
- shortcut ไปฝาก ถอน ประวัติ บัญชีถอน

## Deposit

หน้า: `/deposit`

Flow:

1. เลือกยอดเงิน
2. เลือกวิธีโอน
3. ระบบเลือกบัญชีรับเงินให้อัตโนมัติ
4. โอนเงินตามข้อมูลที่แสดง
5. แนบสลิป
6. ส่งรายการ
7. รอแอดมินตรวจสอบ

ข้อควรระวัง:

- สมาชิกไม่ควรเลือกบัญชีรับเงินเอง
- ระบบ rotation เป็นฝั่ง server
- สลิปเก็บแบบ private storage

## Withdraw

หน้า: `/withdraw`

Flow:

1. ต้องมีบัญชีถอนที่ approved ก่อน
2. เลือกบัญชีถอน
3. กรอกยอดเงิน
4. ส่งคำขอ
5. ยอดถูก lock จนกว่าแอดมิน complete/reject

## Bank accounts

หน้า: `/bank-accounts`

- สมาชิกเพิ่มบัญชีถอนได้ 1 บัญชี
- ชื่อบัญชีต้องตรงกับชื่อสมาชิก
- เพิ่มแล้วรอแอดมินอนุมัติ

## Transactions

หน้า: `/transactions`

ใช้ดู ledger ล่าสุด:

- ฝาก
- ถอน
- ปรับยอด
- balance before/after
