# Game API Worklist

เอกสารนี้เป็น source of truth สำหรับงาน Game API, Provider Simulator, game catalog และ asset mapping ของ Mobile/PC

อัปเดตล่าสุด: 2026-07-20

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

- [x] นำ asset Mobile ชุดจริงเข้า repository
- [ ] นำ asset PC ชุดจริงเข้า repository
- [x] สร้าง inventory ของ provider logos และ game icons
- [ ] ตรวจ duplicate ด้วย content hash
- [ ] สร้าง rename manifest สำหรับชื่อไฟล์ที่ไม่ตรงรูป
- [x] เปลี่ยน mock SVG เป็น asset จริงทีละรายการ
- [x] เพิ่ม fallback image กลางเมื่อ asset โหลดไม่ได้

## Member integration

- [x] เชื่อมหน้า Member games กับ catalog response รุ่นล่าสุด
- [x] เพิ่ม platform filter Mobile/PC
- [x] เพิ่ม provider และ category filter
- [x] เพิ่ม search และ pagination/infinite loading
- [x] เพิ่ม loading, empty และ error states
- [x] ตรวจ responsive mobile/desktop

## Verification

- [ ] รัน provider simulator unit tests ใน CI
- [x] รัน API typecheck และ build
- [x] รัน Member typecheck และ build หลังเชื่อมหน้าเกม
- [ ] รัน browser regression สำหรับ filter, launch และ image fallback

## จำนวนงาน

- ปิดแล้ว: 27 รายการ
- คงค้าง: 5 รายการ
- งานคงค้างฝั่ง asset คือ PC upload, การรัน content-hash report และการตรวจ rename manifest ที่ generator สร้าง

## หลักฐานรอบ Mobile asset

- ชุดจริงอยู่ใน `asset/mobil` และมี `manifest.json` สำหรับ reconciliation
- `apps/api/src/modules/provider-simulator/provider-simulator-catalog.ts` เป็น curated inventory ของเกมและ provider logo ที่ยืนยัน path แล้ว
- Mobile catalog ใช้รูปจริง 7 เกมจาก Kingmaker, NoLimit City, CQ9, Evolution Play, Pragmatic Play และ Fa Chai
- response เพิ่ม `providerName`, `providerLogoUrl`, `fallbackIconUrl` และ `rawPayload.assetSource`
- ค่า `GAME_ASSET_BASE_URL` ใช้ชี้ไป object storage/CDN ได้; หากไม่กำหนดจะใช้ raw repository URL
- `tools/build-game-asset-inventory.mjs` อ่าน manifest, ตรวจไฟล์จริง, คำนวณ SHA-256, สร้าง duplicate groups และเสนอ rename manifest
- SVG endpoint ยังอยู่เป็น fallback สำหรับ PC mock หรือ asset ที่โหลดไม่ได้
- commits: `a5ba00a63046d008af64743bbb3ead9db836e8a1`, `bb3f038918fa9b3b81cea9d8fe71fbfcff968d0d`, `fa3142531c7d85bd4fa8f1e60c8d7618616831d7`

## หลักฐาน Browser และ deployment

- `apps/web-member/app/games/page.tsx` รองรับ response ทั้ง Member lobby แบบเดิมและ catalog response ที่ใช้ `data` array
- `apps/web-member/app/games/games.css` แสดง tabs/toolbar จริงและกำหนด grid 4/3/2/1 คอลัมน์
- `playwright.game-api.config.ts` เปิด Next.js Member จริงทั้ง Chromium และ Mobile Safari
- `tests/game-api-browser/game-lobby.spec.ts` ทดสอบ filter, launch request/session navigation และ broken-image fallback
- workflow `Game API Verification` รัน provider simulator tests, API/Member checks และ browser regression
- ยังไม่ปิดสอง checkbox verification จนกว่า GitHub Actions จะรายงานผลสำเร็จจริง
