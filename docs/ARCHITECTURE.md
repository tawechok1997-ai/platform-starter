# ARCHITECTURE

## Overview

ระบบนี้เป็น Monorepo แยก 3 ส่วนหลัก

- Member App สำหรับผู้เล่น
- Admin App สำหรับแอดมิน
- API Backend สำหรับ business logic ทั้งหมด

## Main rules

- Member และ Admin ต้องแยก app
- Admin ต้องมี RBAC และ Permission
- ระบบเงินต้องใช้ Ledger-based wallet
- Provider callback ต้องมี security guard, idempotency และ lock
