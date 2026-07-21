# Game API Worklist

เอกสารนี้เป็น source of truth สำหรับงาน Game API, Provider Simulator, game catalog และ asset mapping ของ Mobile/PC

อัปเดตล่าสุด: 2026-07-21

## สถานะรวม

- [x] Provider simulator ใช้ wallet หลักของแพลตฟอร์ม
- [x] BET, WIN, REFUND และ ROLLBACK รองรับ idempotency
- [x] HMAC authentication และ timestamp expiry
- [x] Mock launch response พร้อม session expiry
- [x] Game catalog แยก Mobile และ PC
- [x] Provider, platform และ category metadata
- [x] Filter ตาม provider, platform และ category
- [x] Search ตาม code, name, provider และ category
- [x] Pagination จำกัดสูงสุด 100 รายการ
- [x] Sorting ตาม name และ code
- [x] Response รองรับ items, data และ pagination
- [x] SVG icon endpoint พร้อม cache headers
- [x] Regression tests สำหรับ wallet, idempotency และ game transactions
- [x] Regression tests สำหรับ Mobile/PC separation
- [x] Regression tests สำหรับ filtering, search, pagination และ launch metadata

## Asset catalog

- [x] รับและจัดทำ manifest ของ asset Mobile ชุดจริง
- [x] รับและจัดทำ manifest ของ asset PC ชุดจริง
- [x] สร้าง inventory ของ provider logos และ game icons
- [x] ปรับ inventory generator ให้รวม Mobile และ PC
- [x] รองรับ SHA-256 จาก manifest เมื่อ binary เก็บอยู่นอก Git
- [x] สร้าง duplicate groups แบบข้ามแพลตฟอร์ม
- [x] สร้าง rename review manifest แยก platform/category
- [ ] รัน reconciliation ใน CI และ commit generated reports รุ่นรวม PC/Mobile
- [ ] ตรวจและอนุมัติ rename candidates ที่รายงานพบ
- [x] เพิ่ม fallback image กลางเมื่อ asset โหลดไม่ได้

## Member integration

- [x] เชื่อมหน้า Member games กับ catalog response รุ่นล่าสุด
- [x] เพิ่ม platform filter Mobile/PC
- [x] เพิ่ม provider และ category filter
- [x] เพิ่ม search และ pagination/infinite loading
- [x] เพิ่ม loading, empty และ error states
- [x] ตรวจ responsive mobile/desktop

## Verification

- [x] Provider simulator และ Game platform unit tests ผ่านใน Game API Verification run 235
- [ ] ยืนยัน PostgreSQL game concurrency tests หลังแก้ conflicting transaction policy
- [x] รัน API typecheck และ build ในรอบก่อนหน้า
- [x] รัน Member typecheck และ build หลังเชื่อมหน้าเกม
- [ ] รัน browser regression สำหรับ filter, launch และ image fallback หลัง concurrency gate ผ่าน
- [ ] ยืนยัน asset reconciliation step ใน Game API Verification

## จำนวนงาน

- งาน input ภายนอก: 0 รายการ
- งาน repository/CI ที่คงค้าง: 4 รายการ
- งานถัดไป: asset reconciliation report, concurrency verification, rename review และ browser regression

## หลักฐาน Asset catalog

- Mobile manifest อยู่ที่ `asset/catalog/mobile/manifest.json` จำนวน 234 รายการ
- PC manifest อยู่ที่ `asset/catalog/pc/manifest.json` จำนวน 1,544 รายการ
- ทั้งสอง manifest มี `sourceFile`, `sourceUrl`, `repositoryPath`, `size` และ `sha256` สำหรับ reconciliation
- `tools/build-game-asset-inventory.mjs` อ่านทั้งสองแพลตฟอร์มและสร้าง:
  - `docs/generated/game-asset-inventory.json`
  - `docs/generated/game-asset-duplicates.json`
  - `docs/generated/game-asset-rename-manifest.json`
- รายงานใช้เวลาอ้างอิงจาก manifest เพื่อให้ผลลัพธ์ deterministic และตรวจ drift ใน CI ได้
- workflow `Game API Verification` ติดตามการเปลี่ยนแปลงของ manifest, generator และ generated reports แล้ว

## หลักฐาน Browser และ deployment

- `apps/web-member/app/games/page.tsx` รองรับ response ทั้ง Member lobby แบบเดิมและ catalog response ที่ใช้ `data` array
- `apps/web-member/app/games/games.css` แสดง tabs/toolbar จริงและกำหนด grid 4/3/2/1 คอลัมน์
- `playwright.game-api.config.ts` เปิด Next.js Member จริงทั้ง Chromium และ Mobile Safari
- `tests/game-api-browser/game-lobby.spec.ts` ทดสอบ filter, launch request/session navigation และ broken-image fallback
- workflow `Game API Verification` รัน asset reconciliation, provider simulator tests, API/Member checks และ browser regression
- ยังไม่ปิด browser verification จนกว่า workflow จะเดินผ่าน concurrency gate และรายงานผลสำเร็จจริง
