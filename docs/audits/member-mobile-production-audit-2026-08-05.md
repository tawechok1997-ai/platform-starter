# Member Mobile Production Audit

วันที่ตรวจ: 2026-08-05 (Asia/Bangkok)

Production: `https://platformweb-member-production.up.railway.app/`

Audit branch: `audit/mobile-member-full-20260805`

## คำตัดสิน

**ยังไม่พร้อมตรวจรับขั้นสุดท้าย**

หน้าแรกไม่ล้นแนวนอนแล้วและ Popup หลักเปิดได้ครบ แต่ยังมีข้อผิดพลาดระดับสูงใน Sticky chrome, Finance layout, Hydration, Accessibility, Asset loading และ Authenticated-route resilience

## วิธีตรวจ

- Chromium แบบ Mobile/Touch ที่ `360×800`, `390×844`, `430×932`
- เปิด Production จริงสำหรับหน้า Guest, หน้า Public และ Route ต่าง ๆ
- ใช้ Read-only API mocks เฉพาะการตรวจหน้าหลัง Login
- บล็อก POST/ธุรกรรมด้วย HTTP 422 เพื่อไม่แตะเงิน ข้อมูลบัญชี หรือรายการจริง
- ตรวจ DOM geometry, horizontal overflow, sticky/fixed owners, drawer, footer, safe area
- ตรวจ Console error, Page error, HTTP 4xx/5xx, request failure และรูปเสีย
- ตรวจ Touch target, clipped text, tiny text, accessible name, form label, duplicate ID
- ตรวจ WCAG 2 A/AA และ WCAG 2.1 A/AA ด้วย axe-core
- ตรวจ Navigation timing, LCP, CLS, long tasks และจำนวน Resource

## P0: ต้องแก้ก่อนตรวจรับ

### 1. Header และเมนูหมวดเกมไม่ Sticky บน Production

แม้ computed style จะรายงาน `position: sticky` แต่ตำแหน่งเลื่อนหนีออกจาก viewport เท่ากับระยะ scroll

| Viewport | Scroll Y | Header top | Category rail top | Document width |
|---|---:|---:|---:|---:|
| 360×800 | 582 | -582px | -178.23px | 360/360 |
| 390×844 | 540 | -540px | -123.75px | 390/390 |
| 430×932 | 514 | -514px | -81.11px | 430/430 |

ผลคือ Header หาย และเมนูซ้ายไม่ติดใต้ Header ตามต้นฉบับ

**เจ้าของที่ต้องแก้:** `html/body` vertical scroll ownership และ CSS override order ระหว่าง `member-mobile-category-follow.css` กับ `member-mobile-sticky-shell.css`

### 2. `/guide` มี React Hydration Error

Production เกิด `Minified React error #418` ระหว่างเปิดหน้า `/guide`

อาการนี้บ่งชี้ว่า HTML จาก Server กับ Client render ไม่ตรงกัน จึงเสี่ยงต่อ Event binding, DOM กระพริบ และพฤติกรรมไม่แน่นอนหลัง Hydration

## P1: ความผิดพลาดระดับสูง

### 3. Finance pages มี hidden horizontal overflow

ที่ viewport 390px พบ `bodyScrollWidth = 610px` บน:

- `/deposit`
- `/withdraw`
- `/bank-accounts`

หน้าตาที่ตำแหน่งเริ่มต้นยังดูพอดี แต่ Document owner กว้างเกินจอ 220px ซึ่งทำให้เกิดการเลื่อนแนวนอน การ snap ผิด และปัญหาบน Safari ได้

### 4. Dedicated Member routes ไม่ recover เมื่อ authenticated data ผิดรูปแบบ

ทดสอบด้วย Read-only authenticated fixtures พบ 11 Route เกิด Page Error `Unexpected token ':'` และค้างหน้า Loading:

- `/mobile/member/vip`
- `/mobile/member/commission`
- `/mobile/member/affiliate`
- `/mobile/member/bonus`
- `/mobile/member/live`
- `/mobile/member/promotions`
- `/mobile/member/news`
- `/mobile/member/activity`
- `/mobile/member/history`
- `/mobile/member/notifications`
- `/mobile/member/guide`

`/profile/avatar` render ได้ปกติภายใต้ fixture เดียวกัน

ข้อสรุปที่ยืนยันได้คือ Route ชุดนี้ไม่มี Error boundary/timeout ที่พาผู้ใช้พ้นจาก Loading เมื่อ API หรือ payload ผิดสัญญา ส่วนการยืนยันกับข้อมูลบัญชีจริงต้องใช้ Test account แยก ไม่ควรใช้บัญชีเงินจริงเป็นหนูทดลองให้ React

### 5. Missing asset บนหน้า Affiliate

`/mobile/member/affiliate` ขอไฟล์ต่อไปนี้แล้วได้ 404:

```text
/images/income_bg.webp
```

### 6. Authentication routing ไม่สม่ำเสมอ

Guest เข้า Protected routes ส่วนใหญ่จะถูกพากลับหน้าแรกพร้อม `?auth=login&next=...`

แต่ `/mobile/member/bonus` ถูกส่งไป `/session-expired?...` แทน ทั้งที่ยังไม่เคยมี Session

ไม่พบการรั่วของ Member content แต่ UX และ State machine ของ Auth ไม่สม่ำเสมอ

### 7. Drawer ไม่ bounded ตาม viewport

ที่ 390×844 Drawer วัดได้:

- width 340px
- height 2940px
- top 0
- left ประมาณ -21px
- `overflow-y: auto`
- 13 จาก 22 Interactive controls เล็กกว่า 44×44px

ควรให้ Backdrop เป็น fixed viewport owner และ Drawer มี `height/max-height: 100dvh`, safe-area padding และ internal scroll owner เพียงชั้นเดียว

### 8. External image failures

พบ Game/provider images บางรายการโหลดไม่สำเร็จจาก `raw.githubusercontent.com` และ `cdn.zabbet.com` ด้วย ORB/network failure ทำให้ Card บางใบเหลือพื้นว่างหรือ Alt text

ต้องเปลี่ยนเป็น Local canonical assets หรือ Proxy/CDN ที่ตอบ MIME และ CORP/CORS ถูกต้อง

## P2: Accessibility และความสม่ำเสมอ

### 9. Touch targets ต่ำกว่า 44×44px ทุก Route ที่ตรวจ

Guest route matrix 15 Route พบปัญหานี้ครบทั้ง 15 Route

ตัวอย่าง:

- Mobile Home menu 32×32
- Language button 24×24
- Hero dots 6×6
- Login close 30×30
- Password eye 36×36
- Back buttons 40×40
- Promotion category tabs สูง 30px
- Activity Join สูง 28px

### 10. Form controls ไม่มี accessible name

พบอย่างน้อย:

- `/login`: identifier และ password inputs
- `/register`: phone input
- `/browse/games`: search input

ต้องมี `<label>`, `aria-label` หรือ `aria-labelledby` ที่สัมพันธ์กับ control จริง

### 11. Color contrast ไม่ผ่าน

พบใน 8 Route โดยเฉพาะ:

- `/browse/games`
- `/guide`
- `/contact`
- `/legal`
- `/maintenance`
- `/session-expired`
- `/mobile/member/promotions` จำนวน 21 nodes
- `/mobile/member/guide`

### 12. Text เล็กและถูกตัด

- 11 จาก 15 Guest routes มี clipped text
- 9 จาก 15 Guest routes มีข้อความต่ำกว่า 11px
- Mobile Home พบข้อความต่ำกว่า 11px 53 nodes
- `/browse/games` พบ clipped text 46 nodes และ tiny text 80 nodes
- `/mobile/member/promotions` มีชื่อโปรโมชั่นถูก ellipsis
- `/mobile/member/activity` มีหัวข้อถูก clip

### 13. Scrollable rails ใช้ Keyboard ไม่ได้

หน้า Home มี Rank rails อย่างน้อย 2 จุดที่ Axe แจ้ง `scrollable-region-focusable`

ต้องเพิ่ม keyboard focus owner, `tabIndex=0`, accessible label และการควบคุม Arrow/Page keys ตามความเหมาะสม

### 14. VIP page ใช้ ARIA attribute ผิด Role

`/mobile/member/vip` มี `aria-prohibited-attr` ที่ `.sectionLock`

### 15. Language popup แสดงตัวเลือกที่ใช้งานไม่ได้

Popup แสดง 8 ภาษา แต่ Runtime รองรับจริงเฉพาะ Thai/English

กด `Tagalog` แล้ว:

- Dialog ยังเปิดอยู่
- Content ไม่เปลี่ยน
- `<html lang>` ยังเป็น `th`

ควรซ่อน/Disable ภาษาที่ยังไม่รองรับ หรือเพิ่ม Locale bundle และ state owner ให้ครบ

## ราย Route ฝั่ง Guest/Public

| Route | HTTP | ประเด็นหลัก |
|---|---:|---|
| `/` | 200 | Sticky พัง, touch targets, tiny/clipped text, rank rail keyboard |
| `/login` | 200 | 2 unnamed inputs, close/eye targets เล็ก |
| `/register` | 200 | phone input ไม่มี accessible name |
| `/browse/games` | 200 | 60 small targets, 46 clipped, 80 tiny, contrast, search label |
| `/guide` | 200 | Hydration #418, tabs ล้นแนวนอน, contrast |
| `/contact` | 200 | touch target, clipped heading, tiny footer, contrast |
| `/legal` | 200 | touch target, clipped heading, tiny footer, contrast |
| `/maintenance` | 200 | touch target, clipped heading, tiny text, contrast |
| `/session-expired` | 200 | touch target, clipped heading, tiny text, contrast |
| `/mobile/member/vip` | 200 | carousel bounds, small back, clipped/tiny, ARIA |
| `/mobile/member/live` | 200 | small controls |
| `/mobile/member/promotions` | 200 | category rail, 24 small targets, 21 contrast failures |
| `/mobile/member/news` | 200 | back button 40×40 |
| `/mobile/member/activity` | 200 | 4 small targets, 4 clipped text |
| `/mobile/member/guide` | 200 | tab rail bounds, 42 small targets, contrast |

## สิ่งที่ผ่าน

- หน้า Home ไม่มี document-level horizontal overflow ที่ 360/390/430px
- Mobile root กว้างเท่ากับ viewport ทุกขนาด
- หมวดเกม 7 หมวดเปลี่ยน Active state ได้
- Highlight tabs 4 แท็บกดได้
- Popup สมาชิก 10 แบบเปิดได้ครบและตัว Dialog อยู่ใน viewport
- Bottom navigation หลัง Login อยู่ใน viewport 390×52px และปุ่ม 4 ตัวประมาณ 98×45px
- Guest ไม่สามารถอ่าน Protected member content ได้
- Read-only protected routes ไม่มี Login loop และไม่มี Not Found
- `/profile/avatar` render สมบูรณ์ด้วย Mock profile
- LCP หน้า Home อยู่ประมาณ 1.12–1.23 วินาที
- CLS อยู่ประมาณ 0.001–0.047 ซึ่งยังอยู่ในช่วงดี
- Security headers มี CSP, HSTS, X-Frame-Options, Referrer Policy, COOP/CORP และ Permissions Policy

## Performance debt

หน้า Home โหลดประมาณ:

- 250 resources
- 142 images
- 19 scripts
- 51 CSS resources
- Transfer รวมประมาณ 14.3–15.6 MB ต่อการโหลดหนึ่งครั้ง
- 5–7 long tasks

LCP/CLS ยังดีใน Runner แต่ payload หนักมากสำหรับเครือข่ายมือถือจริง โดยเฉพาะ 4G อ่อนหรือเครื่องระดับล่าง

## Security architecture review

### จุดที่ดี

- มี CSP และ Security headers หลัก
- Provider launch มี timeout และ AbortController
- Finance mutation มี Idempotency key และ Recovery flow
- Audit ไม่พบ Guest content leak

### จุดเสี่ยง

- Access token และ Refresh token ถูกเก็บใน `localStorage/sessionStorage` ทำให้ผลกระทบจาก XSS สูงขึ้น
- CSP ยังอนุญาต `'unsafe-inline'` สำหรับ script/style
- Layout import CSS จำนวนมากและมี Owner ซ้อนกันหลายชั้น ทำให้ Regression จาก Cascade เกิดง่ายและส่งต่องานยาก

## ลำดับแก้ที่แนะนำ

1. แก้ Production scroll owner ให้ Header `top:0` และ rail `top:64px` จริงทั้ง 3 viewport
2. แก้ `/guide` Hydration #418
3. แก้ width owner ของ `/deposit`, `/withdraw`, `/bank-accounts` จาก 610px ให้ไม่เกิน viewport
4. เพิ่ม Error boundary/timeout/contract validation ให้ dedicated member routes
5. แก้ missing `/images/income_bg.webp` และย้าย external game images เป็น local-first ที่ตรวจ MIME แล้ว
6. ทำ Touch target baseline 44×44px และ Form label baseline
7. แก้ contrast, tiny text, clipped text และ keyboard scroll rails
8. จำกัด Language popup ให้เฉพาะภาษาที่ทำงานจริง
9. รวม CSS owner และลด CSS imports/overrides ที่ซ้อนกัน
10. วางแผนย้าย Refresh token ไป HttpOnly Secure cookie และลด CSP unsafe-inline

## ข้อจำกัดของ Audit

- ไม่ส่งคำขอฝาก ถอน เปลี่ยนรหัส หรือ Mutation จริง
- ไม่ใช้บัญชี Member จริง
- Authenticated flows ใช้ Read-only fixtures จึงตรวจ Layout, Routing, Popup และ Error recovery ได้ แต่ไม่ยืนยันยอดเงินจริงหรือ Provider launch จริง
- Horizontal carousels ที่ตั้งใจให้ scroll ได้ถูกแยกจาก document-level overflow แต่ยังต้องมี keyboard/accessibility owner
