# Member UX/UI Tooling Guide

> เป้าหมาย: หน้า Member ต้อง mobile-first, โหลดเร็ว, ใช้ง่าย, ไม่รก และไม่ใช้เครื่องมือหนักเกินความจำเป็น

## 1. Tool Stack หลัก

- Framework: `Next.js` + `React`
- UI primitives: `shadcn/ui`
- Icons: `lucide-react`
- Server state: `@tanstack/react-query`
- Forms: `react-hook-form`
- Validation: `zod` + `@hookform/resolvers`
- Toast: `sonner`
- Date/time: `date-fns`
- Carousel: `embla-carousel-react`
- Mobile drawer: `vaul`
- File upload: `react-dropzone`
- Image compression: `browser-image-compression`
- Charts: `recharts` เฉพาะหน้าที่มีข้อมูล time-series จริง
- Desktop transaction table: `@tanstack/react-table`
- Large game catalog: `@tanstack/react-virtual`

## 2. Typography

### ฟอนต์หลัก

ใช้ `IBM Plex Sans Thai` เป็นตัวเลือกหลักสำหรับหน้า Member

- ดูทันสมัยและเป็นมืออาชีพ
- ภาษาไทยและอังกฤษสมดุล
- ตัวเลขการเงินอ่านง่าย
- เหมาะกับ Dashboard, Wallet, Deposit, Withdraw และ Transaction

ตัวเลือกสำรองที่ปลอดภัย: `Noto Sans Thai`

### ห้ามใช้

- ห้ามใช้ฟอนต์เกิน 2 ตระกูลในระบบเดียว
- ห้ามใช้ Prompt หรือ Kanit เป็น body ทั้งเว็บ
- ห้ามใช้ฟอนต์ตกแต่งในฟอร์มและข้อมูลการเงิน

### น้ำหนัก

- Body: `400`
- Input/Label: `400-500`
- Button: `600`
- Card title: `600`
- Page heading: `700`
- Wallet/KPI value: `700`

### ขนาด

- Body: `14-16px`
- Input: `16px`
- Button: `15-16px`
- Card title: `16-18px`
- Page heading: `24-30px`
- Wallet balance: `30-40px`
- Caption: `12-13px`

### ตัวเลข

ใช้ `font-variant-numeric: tabular-nums` กับ:

- ยอดเงิน
- ค่าธรรมเนียม
- เวลานับถอยหลัง
- OTP countdown
- Transaction amount

## 3. Icon Standard

ใช้ `Lucide React` ชุดเดียวทั้งระบบ

- Navigation: `21px`
- Button: `16-18px`
- Card: `20px`
- Status: `14-16px`
- Empty state: `32-40px`
- Stroke width: `1.8-2`

ห้ามใช้อีโมจิเป็นไอคอน UI และห้ามผสม Lucide, Font Awesome, Material Icons หรือ SVG คนละสไตล์

ปุ่มสำคัญต้องใช้ Icon + Text ส่วน Icon-only ต้องมี Tooltip และ `aria-label`

## 4. มาตรฐานกลางหน้า Member

- ออกแบบ Mobile-first
- Bottom navigation: Home, Games, Wallet, Promotions, Account
- เมนูรองใช้ Drawer/Bottom Sheet
- Touch target ขั้นต่ำ `44px`
- Primary Action หนึ่งรายการต่อหน้า
- Error ต้องแสดงใกล้ช่องหรือ action ที่เกี่ยวข้อง
- งานการเงินต้องมี Confirm summary ก่อนส่ง
- ป้องกัน double submit ทุก mutation
- Loading ใช้ Skeleton ตาม layout จริง
- Empty state ต้องบอกสิ่งที่ผู้ใช้ทำต่อได้
- Mobile ห้ามใช้ตารางแนวนอน

## 5. เครื่องมือรายหน้า

### Login

- Tool: React Hook Form, Zod, shadcn Input/Button, Lucide, Sonner
- Features: Password visibility, loading state, inline error, forgot password
- ไม่ใช้กราฟ ตาราง หรือ animation library ขนาดใหญ่

### Register

- Tool: React Hook Form, Zod, TanStack Query mutation, OTP Input, Lucide
- Flow: Account info, contact verification, password, terms, success
- Features: Password strength, username availability, OTP countdown

### Forgot / Reset Password

- Tool: React Hook Form, Zod, OTP Input, TanStack Query mutation
- Flow: Identify account, OTP, new password, success
- หลังสำเร็จควร revoke session เดิมตาม policy

### Member Dashboard

- Tool: TanStack Query, shadcn Card, Lucide, Embla Carousel, date-fns
- Sections: Wallet summary, quick actions, promotions, recent transactions, favorite games, notification preview
- Recharts ใช้เฉพาะกราฟที่มีข้อมูลจริง

### Deposit

- Tool: React Hook Form, Zod, TanStack Query, React Dropzone, browser-image-compression, Dialog/Alert/Progress, date-fns
- Flow: Amount, destination account, transfer reference/time, slip upload, review, submit, status tracking
- ต้องคง staged workflow และ duplicate-slip feedback
- Upload ต้องตรวจ file type/size และบีบภาพโดยไม่ทำให้สลิปอ่านไม่ได้

### Withdraw

- Tool: React Hook Form, Zod, TanStack Query, AlertDialog, date-fns
- Flow: Bank account, amount, fee, net amount, confirm, staged status
- ต้องแสดง available balance, min/max, fee และยอดรับจริง
- ป้องกัน double submit และแสดง status timeline

### Transaction History

- Tool: TanStack Query, date-fns, Tabs, Sheet, Badge
- Desktop ใช้ TanStack Table ได้
- Mobile ใช้ Transaction Card List
- Filter: All, Deposit, Withdraw, Bonus, Game, Date, Status

### Wallet

- Tool: TanStack Query, Card, Tabs, Lucide
- Sections: Available, Locked, Bonus, Total, shortcuts, movement
- Recharts ใช้ Area Chart เดียวเมื่อ API มีข้อมูลรายวันจริง

### Bank Accounts

- Tool: React Hook Form, Zod, TanStack Query, Dialog/Drawer, Lucide
- Features: Add, verify, set default, disable/delete, status
- Security: Mask account number, OTP/re-auth, cooling period หลังเปลี่ยนบัญชี

### Games Lobby

- Tool: TanStack Query, Embla Carousel, Next/Image, Lucide, React Virtual เมื่อเกมจำนวนมาก
- Sections: Search, providers, categories, featured, recent, favorites, all games
- Performance: Lazy image, blur placeholder, debounced search, cache catalog

### Game Detail / Launch

- Tool: TanStack Query, Dialog/Drawer, Lucide
- Features: Cover, provider, category, favorite, balance warning, maintenance state, play action
- Launch flow ต้องจัดการ session, wallet check และ error recovery

### Favorites / Recently Played

- Tool: TanStack Query optimistic mutation, Next/Image
- UI เปลี่ยนทันทีและ rollback เมื่อ API ล้มเหลว

### Promotions

- Tool: TanStack Query, Embla Carousel, Card, Tabs, Accordion, date-fns
- Sections: Available, Claimed, Active, Expired, eligibility, expiry, terms summary
- ห้ามยัดเงื่อนไขทั้งหมดลงการ์ด

### Promotion Detail / Claim

- Tool: React Hook Form, Zod, TanStack Query mutation, AlertDialog, date-fns
- แสดง reward, requirements, eligibility, progress, expiry และ claim action

### Bonus Wallet / Bonus History

- Tool: TanStack Query, Tabs, Progress, date-fns
- แสดง available bonus, locked bonus, wager progress, expiry และ history

### Profile

- Tool: React Hook Form, Zod, TanStack Query, Tabs, Lucide
- แยก Save ต่อ section
- Sections: Personal, Contact, Address, Preferences, Language, Status

### Security

- Tool: React Hook Form, Zod, TanStack Query, OTP Input, AlertDialog, Lucide
- Sections: Password, MFA, sessions, trusted devices, login history, logout all

### KYC

- Tool: React Hook Form, Zod, React Dropzone, browser-image-compression, TanStack Query, Stepper
- Flow: Personal info, document type, front/back upload, selfie, review, submit, pending
- กล้องต้องมี fallback เลือกรูป

### Notifications

- Tool: TanStack Query, Intersection Observer, date-fns, Lucide
- Categories: Finance, Promotion, Security, System, Support
- Features: Mark read, mark all, infinite load, deep link, unread badge

### Support Tickets

- Tool: React Hook Form, Zod, TanStack Query, React Dropzone, Sheet/Accordion
- Pages: Ticket list, ticket detail, conversation, attachment, reply, related transaction

### FAQ

- Tool: Search input/Command, Accordion
- ใช้ Fuse.js เฉพาะ FAQ ที่โหลดทั้งหมดฝั่ง client และมีขนาดเล็ก
- ถ้าข้อมูลมากให้ค้นผ่าน API

### Terms / Privacy / Static Content

- Tool: MDX หรือ CMS content, typography styles, table of contents
- ไม่ต้องใช้ Table, Chart หรือ Form library

## 6. Query Key Standard

```ts
memberKeys.profile()
memberKeys.wallet()
memberKeys.transactions(filters)
memberKeys.topups()
memberKeys.withdrawals()
memberKeys.promotions()
memberKeys.games(filters)
memberKeys.notifications()
memberKeys.supportTickets()
```

## 7. ลำดับติดตั้ง

### Phase 1: จำเป็น

```bash
pnpm --filter @platform/web-member add \
  lucide-react \
  @tanstack/react-query \
  react-hook-form \
  zod \
  @hookform/resolvers \
  sonner \
  date-fns
```

### Phase 2: Upload และ Mobile UX

```bash
pnpm --filter @platform/web-member add \
  embla-carousel-react \
  react-dropzone \
  browser-image-compression \
  vaul
```

### Phase 3: ติดตั้งเมื่อมีหน้าที่ใช้จริง

```bash
pnpm --filter @platform/web-member add \
  recharts \
  @tanstack/react-table \
  @tanstack/react-virtual
```

## 8. สิ่งที่ไม่แนะนำ

- Ant Design ทั้งชุด
- React Admin
- Refine ทั้ง framework
- AG Grid สำหรับหน้า Member
- Material UI ผสมกับ shadcn/ui
- กราฟหลาย library
- Icon หลายชุด
- Emoji UI
- ติดตั้ง dependency ที่ยังไม่มีหน้าใช้งานจริง

## 9. เกณฑ์รับงาน

- เปิดหน้าแล้วเข้าใจสิ่งที่ต้องทำภายใน 5 วินาที
- Primary Action ชัดและมีเพียงหนึ่งรายการ
- Mobile ไม่มีตารางแนวนอน
- ทุก mutation ป้องกัน double submit
- งานการเงินมี Confirm summary และสถานะหลังส่ง
- ทุกหน้ามี Loading, Empty และ Error
- สี ฟอนต์ ไอคอน ระยะห่าง และสถานะใช้มาตรฐานเดียวกัน
- รองรับ keyboard, focus state, screen reader และ reduced motion
