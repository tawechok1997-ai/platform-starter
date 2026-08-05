# Member Desktop Production Audit

วันที่ตรวจ: 2026-08-05 (Asia/Bangkok)

Production: `https://platformweb-member-production.up.railway.app/`

Audit branch: `audit/desktop-member-full-20260805`

Pull request: `#568`

GitHub Actions run: `30951391067`

Artifact: `8909441369`

## คำตัดสิน

**Desktop ยังไม่พร้อมตรวจรับขั้นสุดท้าย**

หน้าแรกพอดี viewport ทุกขนาด Header ทำงาน และ Modal/Popup หลักเปิดได้ แต่ยังมีปัญหาระดับสูงใน Jackpot sidebar follow behavior, payload ขนาดประมาณ 40 MB, missing assets, Activity/News data, Accessibility และการจัดการสถานะหลังปิด Auth modal

## วิธีตรวจ

- Chromium แบบ Desktop ที่ `1024×768`, `1366×768`, `1440×900`, `1920×1080`
- เปิด Production จริงสำหรับ Home และ Guest/Public routes
- Route matrix ฝั่ง Guest/Public 16 routes
- ตรวจ Game click → Login, Login/Register modal และ cleanup หลังปิด
- ตรวจ Shared popup: all, promotion, activity, news, language
- ตรวจ Read-only authenticated routes 14 routesด้วย JWT fixture รูปแบบถูกต้อง
- บล็อก POST/Mutation ด้วย HTTP 422 ไม่แตะยอดเงินจริง รายการฝากถอน หรือข้อมูลบัญชีจริง
- ตรวจ Header, Main column, Jackpot sidebar, Footer, sticky/fixed owners และ responsive geometry
- ตรวจ horizontal overflow, elements outside viewport, clipped/tiny text, duplicate IDs และ form labels
- ตรวจ HTTP 4xx/5xx, missing assets, request failures, Console/Page errors
- ตรวจ WCAG 2 A/AA และ WCAG 2.1 A/AA ด้วย axe-core
- ตรวจ LCP, CLS, long tasks, resource count และ transfer size

## P0: ต้องแก้ก่อนตรวจรับ

### 1. Jackpot sidebar อยู่ถูกตอนเปิดหน้า แต่หายเมื่อเลื่อน

หน้าแรกตอนเริ่มโหลดมี Main feed ด้านซ้ายและ Jackpot/Leaderboard rail ด้านขวาตรงตามต้นฉบับ

ที่ viewport `1440×900` ตอนเริ่มต้น Sidebar มี geometry ประมาณ:

- left: `1069px`
- width: `356px`
- top: `444px`
- height: `544px`

เมื่อเลื่อนลงประมาณ `831px` Sidebar มี top ประมาณ `-353px` และ bottom `192px` จากนั้นหายออกจาก viewport ทิ้งพื้นที่ว่างด้านขวาประมาณ 370px ขณะที่ Main feed ยังมีความกว้างเดิม

ตอนเลื่อนถึงด้านล่าง Sidebar top อยู่ประมาณ `-2209px`

โค้ด `HomeSidebarScrollController` ตั้งใจให้ Runtime เป็นเจ้าของ two-column geometry และคำนวณตำแหน่ง sidebar ตาม scroll แต่ Production computed behavior ยังทำงานเหมือน `position: sticky` ที่ถูก scroll container ตัดออก จึงต้องแก้ ownership ให้มีเพียงระบบเดียว

**เจ้าของที่ต้องตรวจ:**

- `apps/web-member/app/components/member-home/home-sidebar-scroll-controller.tsx`
- CSS ของ `.desktop-home__body`, `.reference-sidebar`, `.desktop-home__sidebar`
- Parent overflow/contain/transform ที่สร้าง sticky containing block

## P1: ความผิดพลาดระดับสูง

### 2. หน้า Home โหลดประมาณ 40 MB ต่อครั้ง

ผลวัด Production:

| Viewport | Resources | Transfer | LCP | CLS |
|---|---:|---:|---:|---:|
| 1024×768 | 219 | 40.82 MB | 1.62s | 0.0245 |
| 1366×768 | 220 | 40.01 MB | 1.56s | 0.0107 |
| 1440×900 | 219 | 40.58 MB | 1.84s | 0.0098 |
| 1920×1080 | 222 | 40.40 MB | 1.55s | 0.0058 |

ที่ `1440×900` มีประมาณ:

- 137 image resources
- 19 scripts
- 35 CSS resources
- 5 long tasks

LCP และ CLS ยังดีใน GitHub runner แต่ Payload 40 MB หนักเกินไปสำหรับผู้ใช้จริง ทั้ง bandwidth, memory, decode time และเครื่องระดับกลาง

ควรทำ image sizing, WebP/AVIF, lazy loading ที่แท้จริง, ลด preloaded catalog, ลด CSS bundles และไม่โหลดทุก provider/game asset ตั้งแต่หน้าแรก

### 3. Missing assets และ URL รูปผิดประเภท

Production ขอ asset ต่อไปนี้แล้วได้ 404:

```text
/%F0%9F%8E%81
```

เส้นทางนี้คือ Emoji `🎁` ถูกนำไปใช้เป็น URL รูปภาพ แทนที่จะเป็น fallback text/icon

หลัง Login ยังพบ Game images ที่ไม่มีอย่างน้อย 3 ไฟล์:

```text
/assets/asset-pc/images/games/1771410340768-9111777a-cc42-49d0-a99e-8cdcaef58481.png
/assets/asset-pc/images/games/1783563389284-d519ede0-88e1-4073-ba28-db5294fad9cb.png
/assets/asset-pc/images/games/1771481607415-fd863209-0afc-434f-92bd-7b7a07b13a0b.png
```

ต้องแยก fallback glyph ออกจาก image source type และเพิ่ม asset manifest validation ก่อน Build

### 4. Activity และ News popup เปิดได้ แต่ข้อมูล Production ว่าง

Shared popup ทั้ง 5 แบบเปิดและอยู่ใน viewport:

- all
- promotion
- activity
- news
- language

Promotion popup แสดงหมวดและการ์ด 3 คอลัมน์ได้

แต่ Activity popup แสดง `ยังไม่มีกิจกรรม` และ News popup แสดง `ไม่มีข้อความใหม่`

โค้ดปัจจุบันสร้าง Activity เฉพาะ `cms_content.announcements` ที่ `kind === 'event'` และ News ที่ `kind === 'news'` โดยไม่มี Source fallback เมื่อ CMS ว่าง ดังนั้น Production จะว่างทันทีหาก Seed/CMS ไม่มีข้อมูลประเภทนั้น

ต้องเลือกทางเดียวให้ชัด:

1. Seed Source Activity/News เข้า Site Settings ทุก Environment
2. หรือเพิ่ม Source fallback ที่มี version/owner ชัดเจน

ไม่ควรมีทั้ง CMS, hardcoded fallback และ Runtime patch หลายเจ้าของพร้อมกัน เพราะสุดท้ายไม่มีใครรู้ว่า Production กำลังเชื่ออะไรอยู่

### 5. Console และ Network errors มีจำนวนมาก

Guest matrix พบ:

- Console error groups 17
- HTTP error groups 17
- Request failed 22

Authenticated matrix พบ:

- Console error groups 7
- HTTP error groups 7
- Request failed 57

ส่วนหนึ่งเป็น `net::ERR_ABORTED` จาก Next.js prefetch/navigation หรือ page closure ซึ่งเป็น Audit noise ไม่ควรนับเป็น Production defect โดยตรง

ส่วนที่เป็น defect จริงคือ Missing assets และ API/asset responses ที่ได้ 404 ต้องแยก filter ใน CI เพื่อให้รายงานไม่แดงเพราะ Browser ยกเลิก request ที่ไม่จำเป็น

### 6. `/status` ไม่มี Route จริง

`/status` ตอบ HTTP 404 และจบที่ Login flow

Audit ยังไม่ยืนยันว่ามีปุ่ม Production ใดชี้มาที่ `/status` ดังนั้นมีสองทาง:

- ถ้า Route นี้อยู่ใน Public route contract ให้สร้างหน้า Status จริง
- ถ้าไม่ใช่ Contract ให้ลบออกจาก route inventory/docs/tests

อย่าปล่อย Route ผีไว้ให้ทีมใหม่ตามหาว่ามันเคยมีจริงหรือเป็นตำนานพื้นบ้านของ Repository

### 7. Auth modal ปิดแล้ว URL state ยังหลงเหลือ

Game click ฝั่ง Guest ทำงานถูก:

```text
/?auth=login&next=%2Fbrowse%2Fgames
```

Login และ Register modal แสดงผลและปิดได้ ไม่มี Dialog ซ้อนค้าง

แต่หลังปิด Login modal URL ยังมี `?auth=login` อยู่ ทำให้ Refresh, Back/Forward หรือ Share URL อาจเปิด Modal กลับมาอีกครั้งโดยผู้ใช้ไม่ได้ตั้งใจ

ควรลบเฉพาะ `auth` parameter หลังปิด โดยคง `next` เฉพาะเมื่อยังต้องใช้ หรือคืน URL ก่อนเปิด Modal

### 8. Account/Profile menu ยังตรวจ ownership ไม่ได้ชัด

Header หลัง Login แสดง:

- ยอดเงิน
- ฝาก
- ถอน
- Notification
- Avatar/Profile

Notification popup เปิดได้และอยู่ใน viewport

การคลิก candidate ฝั่ง Profile ใน Audit ไม่พบ Dialog/Menu ที่ตรวจจับได้ จึงต้องเพิ่ม data owner ที่ชัดเจน เช่น:

```text
data-member-account-trigger
data-member-account-menu
```

เพื่อให้ทั้ง Regression test และทีมส่งต่องานรู้ว่าปุ่มใดเป็นเจ้าของเมนูจริง

## P2: Accessibility และความสม่ำเสมอ

### 9. Guest/Public route matrix

ตรวจ 16 routes ได้ผลรวม:

- Critical: `0`
- High: `37`
- Medium: `80`

ปัญหาที่เกิดซ้ำ:

- Target ต่ำกว่า 32×32px: 16 routes
- Clipped text: 16 routes
- Text ต่ำกว่า 11px: 9 routes
- Elements outside viewport ที่ไม่ใช่ rail ชัดเจน: 8 routes
- Color contrast: 6 routes
- Unnamed interactive: 3 groups
- Duplicate IDs: 2 routes

หมายเหตุ: Offscreen carousel slides ถูกแยกจาก document-level overflow แล้ว แต่บาง rail ยังไม่มี keyboard owner

### 10. Controls เล็กเกินไป

หน้า Home พบ target ต่ำกว่า 32px หลายจุด เช่น:

- Hero carousel dots ประมาณ `6×6px`
- Highlight dots ประมาณ `7×7px`
- Tournament info controls ประมาณ `24×20px`
- Footer links สูงประมาณ `20px`
- Header Deposit/Withdraw หลัง Login สูงประมาณ `32px`

สำหรับ Desktop ควรใช้ target baseline อย่างน้อย `32×32px` และสำหรับ control ที่ใช้ร่วมกับ Touch device ควรขยับเป็น `44×44px`

### 11. Form controls ไม่มี accessible name

พบใน Guest/Public อย่างน้อย:

- Login identifier/password controls
- Register phone/control บางรายการ
- Browse/Search input

พบใน Authenticated Support อย่างน้อย:

- input
- textarea
- input

ต้องเชื่อม `<label for>` หรือ `aria-label/aria-labelledby` กับ control จริง ไม่ใช่วางข้อความไว้ข้าง ๆ แล้วหวังว่า Screen reader จะอ่านใจนักออกแบบได้

### 12. Color contrast

พบใน Public routes 6 กลุ่ม และ Authenticated routes 9 กลุ่ม

จุดเด่นที่ต้องแก้:

- Browse/Search filters
- Guide/Public page controls
- FAQ categories
- Ticket filters
- Search labels เช่น `ค้นหา`, `ล่าสุด`, `รายการโปรด`, `เกมฮอต`, `เกมใหม่`

### 13. Duplicate IDs

พบใน:

- `/contact`
- `/legal`

Duplicate ID ทำให้ label targeting, anchor navigation และ automated test selectors ไม่แน่นอน

### 14. Clipped text และ Tiny text

ทุก Public route ที่ตรวจมี clipped text อย่างน้อยหนึ่งจุด แต่บางรายการเกิดจาก Thai font metrics ที่ `scrollHeight` มากกว่า `clientHeight` 2–3px จึงต้องแยก false positive ออกจาก ellipsis จริง

จุดที่ควรแก้จริง:

- Card titles ที่ถูกตัดก่อนจบคำ
- Search/filter labels 10px
- Footer links ที่สูงเพียงประมาณ 20px
- Promotion/activity card copy ที่จำกัด line-height ต่ำเกินไป

## ราย Route ฝั่ง Guest/Public

| Route | ผลหลัก |
|---|---|
| `/` | Layout เริ่มต้นถูก, Jackpot rail หายเมื่อ scroll, payload ~40 MB, missing gift asset |
| `/login` | Render ได้, form labels/target size ยังไม่ครบ |
| `/register` | Render ได้, form accessible name ยังไม่ครบ |
| `/browse/games` | Render ได้, search label, contrast, tiny/clipped text และ asset/network debt |
| `/browse/promotions?view=promotion` | Render ได้, Promotion popup/grid ทำงาน |
| `/browse/promotions?view=activity` | Route ทำงาน แต่ Production Activity data ว่าง |
| `/browse/promotions?view=news` | Route ทำงาน แต่ Production News data ว่าง |
| `/games` | Guest ถูกส่ง Login พร้อม next path |
| `/search` | Guest ถูกส่ง Login พร้อม next path |
| `/live` | Guest ถูกส่ง Login พร้อม next path |
| `/guide` | Render ได้ แต่ยังมี contrast/tiny target debt |
| `/contact` | Render ได้, duplicate ID |
| `/legal` | Render ได้, duplicate ID |
| `/maintenance` | Render ได้ |
| `/session-expired` | Render ได้ |
| `/status` | HTTP 404, ต้องสร้างหรือถอดออกจาก contract |

## Authenticated routes

ตรวจ 14 routes ด้วย Read-only fixture:

- ไม่มี HTTP failure
- ไม่มี Login redirect loop
- ไม่มี Page crash
- Deposit/Withdraw/Bank accounts ไม่มี document-level horizontal overflowบน Desktop
- Profile avatar route render ได้
- Notification popup เปิดและอยู่ใน viewport

แต่ยังพบ High 25 และ Medium 98 ส่วนใหญ่จาก Accessibility, missing assets, console/network responses และข้อความถูกตัด

## สิ่งที่ผ่าน

- Home ไม่มี document-level horizontal overflow ที่ 1024, 1366, 1440 และ 1920px
- Header sticky อยู่ในตำแหน่งเมื่อ scroll
- Main feed อยู่ด้านซ้ายและ Jackpot rail อยู่ด้านขวาตอนเริ่มต้น
- Footer อยู่ใน document flow และไม่ซ้อนเนื้อหา
- Home ไม่มี Page error ทั้ง 4 viewport
- Game click ฝั่ง Guest เปิด Login flow พร้อม `next`
- Login/Register modal render และปิดได้
- Shared popup 5 แบบเปิดครบและอยู่ใน viewport
- Promotion popup มี category tabs และ grid 3 คอลัมน์
- Notification popup หลัง Login เปิดได้
- Authenticated route matrix 14 routesไม่มี HTTP failure หรือ redirect loop
- Finance pages ไม่มี horizontal overflow บน Desktop
- LCP อยู่ประมาณ 1.55–1.84 วินาที
- CLS อยู่ประมาณ 0.006–0.025

## Security และ Architecture

### จุดที่ดี

- Authenticated audit ใช้ JWT fixture รูปแบบถูกต้องและบล็อก Mutation ทั้งหมด
- Guest game action ส่ง `next` path กลับ Login flow
- Modal/Popup มี owner แยกและไม่พบ Dialog ซ้อนหลังปิด
- Security headers หลักมีอยู่จาก Shared Next configuration

### จุดเสี่ยง

- Desktop viewport ถูกเลือกหลัง client layout effect จึงมี placeholder ก่อน render Home จริง
- Sidebar geometry มีทั้ง CSS sticky และ JavaScript scroll controller เป็นเจ้าของพร้อมกัน
- Asset fallback บางจุดไม่มี type contract ทำให้ Emoji ถูกใช้เป็น URL
- CMS popup content ไม่มี fallback/data readiness contract
- CSS และ Runtime ownership หลายชั้นทำให้แก้ตำแหน่งหนึ่งแล้วอีก owner สามารถทับใน Production ได้

## ลำดับแก้ที่แนะนำ

1. รวม Jackpot rail ให้มี geometry owner เพียงระบบเดียวและให้ตาม scrollจริง
2. ลด Home payload จาก ~40 MB ลงอย่างน้อย 60–75%
3. แก้ Emoji URL และ missing game assets พร้อมเพิ่ม asset manifest validation
4. Seed/restore Activity และ News content บน Production
5. แยก real network failures ออกจาก aborted prefetch ใน CI
6. ล้าง `auth` query state หลังปิด Login/Register modal
7. เพิ่ม Account menu data owner และ Regression test
8. ทำ Desktop target baseline 32px/Touch-shared 44px
9. แก้ accessible labels, contrast, duplicate IDs และ tiny/clipped text
10. ตัดสินใจ `/status` ให้เป็น Route จริงหรือถอดออกจาก contract

## ข้อจำกัดของ Audit

- ไม่ส่งคำขอฝาก ถอน เปลี่ยนรหัส หรือธุรกรรมจริง
- ไม่ใช้บัญชี Member จริง
- ไม่เปิดเกม Provider จริง
- Authenticated data ใช้ Read-only fixtures จึงยืนยัน Layout, Routing, Error handling และ Popup ownership แต่ไม่ยืนยันยอดเงินจริง
- `net::ERR_ABORTED` จาก Next prefetch/navigation ถูกจัดเป็น Noise เว้นแต่มี HTTP/asset failure จริงประกอบ
