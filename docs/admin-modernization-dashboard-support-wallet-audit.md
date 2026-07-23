# Admin Modernization Audit — Dashboard, Wallet, Support และ Audit Risk

อัปเดต: 2026-07-23

สถานะในเอกสารนี้ตรวจจากโค้ดบน `main`

## `/dashboard`

- [x] มี operational status อยู่ด้านบน
- [x] มี urgent/priority lanes สำหรับ Critical Risk, Withdrawals และ Topups
- [x] มี Finance KPI และ Operations KPI
- [x] มี SLA thresholds 30/60 นาที พร้อม overdue/critical/oldest queue metrics
- [x] มี Risk pressure และ Finance flow/comparison
- [x] มี Quick Actions ตาม permission
- [x] มี Role/permission-based sections
- [x] มี Recent Ledger พร้อมลิงก์ดูทั้งหมด
- [x] มี partial-data handling, retry notice และ loading skeleton
- [~] Recent Ledger ไม่ได้จำกัดใน UI เป็น 5 รายการอย่างชัดเจน แต่ใช้ข้อมูลจาก API ตามที่ส่งมา
- [~] ลำดับภาพรวมใกล้เคียงเป้าหมาย แต่ยังไม่มี rendered UX evidence ว่าไม่มี KPI/กราฟซ้ำและ wallet total ไม่ตัดบรรทัด

## `/wallet-statement`

- [x] Filter สมาชิกและช่วงวันที่
- [x] แสดง balance before/after และ Running balance ในรายละเอียด
- [x] Grouping ตามวัน
- [x] Export CSV
- [x] Print/PDF ผ่าน browser print
- [x] Transaction detail drawer
- [x] Server-side pagination
- [x] Loading, empty และ error states
- [~] Custom drawer ยังไม่มี focus trap/restore และ Escape evidence
- [~] Error path ยังอาจแสดง backend message ตรง

## `/wallet-analytics`

- [x] ช่วงเวลา 7/14/30/90 วัน
- [x] Daily net-flow bar chart
- [x] Tooltip ผ่าน `title` ต่อ bar
- [x] Liquidity metrics, pending queues และ risk tones
- [x] Empty state
- [x] Loading skeleton และ retry-safe load flow
- [x] Daily data table ใช้เป็นรายละเอียดประกอบกราฟ
- [~] ไม่มี line chart แยก
- [~] ไม่มี legend component แยก แต่มี labels/table และ accessible chart label
- [~] Error path ยังอาจใช้ backend message ตรง

## `/support-center`

- [x] Priority/severity และ SLA ต่อ ticket
- [x] Open/Reviewing/Resolved/Dismissed workflow
- [x] Canned/quick replies
- [x] Conversation timeline
- [x] Status/category filters
- [x] Permission guards สำหรับ reply และ manage
- [x] Confirmation ก่อนเปลี่ยนสถานะ
- [x] Loading skeleton และ empty state
- [~] Mutation functions ยังไม่มี `try/catch/finally` ครบ
- [~] บาง backend message ยังแสดงตรง
- [~] Template action ใช้ native button แทน shared component

## `/audit-risk`

- [x] Event timeline/recent risky events
- [x] Risk type/module filter และช่วงเวลา 1/7/30 วัน
- [x] Before/after drawer
- [x] Export CSV
- [x] Related record ID
- [x] Summary by module/action/admin
- [x] Read-only guard
- [~] Related record ยังแสดง ID แต่ไม่มี deep-link เฉพาะ record ใน drawer
- [~] Custom drawer ยังไม่มี focus trap/restore evidence
- [~] Payload redaction และ safe error ยังไม่ยืนยันครบ

## ผลที่ควรรวมกลับลิสต์หลัก

- Dashboard: SLA countdown/queue age, Quick Actions และ Role-based dashboard เป็น `[x]`; layout order, duplicate KPI และ wallet wrapping คงเป็น `[~]`
- Wallet Statement: ทั้ง 5 ข้อเดิมเป็น `[x]`
- Wallet Analytics: 7/30/90, chart, empty state และ tooltip เป็น `[x]`; line chart/legend เป็น `[~]`
- Support Center: Ticket priority, SLA, canned response, timeline และ status workflow เป็น `[x]`
- Audit Risk: timeline, filter, before/after, export และ related record เป็น `[x]` โดย deep-link/focus/redaction ยังเป็น `[~]`
