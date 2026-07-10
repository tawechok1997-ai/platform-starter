# AI CONTEXT

โปรเจกต์นี้คือ Platform Monorepo สำหรับระบบเว็บที่แยก Member App, Admin App และ API Backend

## Tech stack

- Next.js for frontend
- NestJS for backend
- PostgreSQL + Prisma
- Redis + BullMQ
- MinIO or S3 for media
- Docker + Nginx for deploy

## Important context

- ระบบต้องแยกหน้าผู้เล่นกับแอดมิน
- แอดมินต้องมีระดับสิทธิ์
- ระบบเงินต้องใช้ ledger
- Provider integration ต้องผ่าน adapter layer
- Callback ต้องปลอดภัยและกันซ้ำ
