# Member Branding Progress Round 2

สถานะรอบนี้

- ✅ เพิ่ม `useBrandRuntime()` เพื่อเชื่อม Brand runtime กับ `SiteSettingsProvider` เดิมโดยไม่ fetch ซ้ำ
- ✅ เพิ่ม `AuthBrandShell` แบบ presentation-only
- ✅ รองรับโลโก้แยก Login/Register พร้อม fallback
- ✅ ใช้ Design tokens จาก Brand runtime กับ Auth shell
- ✅ ไม่แก้ API, Session, Captcha, Validation หรือ Redirect เดิม
- 🧪 รอรัน Member test, typecheck และ build
- 🔄 เตรียมย้าย Login/Register consumer ทีละหน้า หลังตรวจ branch ให้ตรงกับ `main`

ข้อควรระวัง

- Branch ปัจจุบันตามหลัง `main` อยู่ 2 commits จึงยังไม่ควร merge
- Auth shell ยังเป็น additive component และยังไม่แทน flow เดิม
- การย้ายหน้า Login/Register ต้องทำหลัง rebase/update branch และตรวจ rendered UI
