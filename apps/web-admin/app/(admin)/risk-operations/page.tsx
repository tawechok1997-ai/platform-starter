'use client';

import { AdminBadge, AdminCard, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminPage, AdminStack } from '../_components/admin-ui';

type RiskArea = { title: string; description: string; href: string; action: string; status: string; tone: 'success' | 'warning' | 'danger' | 'neutral' };

const AREAS: RiskArea[] = [
  { title: 'Risk Dashboard', description: 'ดูแรงกดดันความเสี่ยง งานวิกฤต และทางลัดเข้าสู่คิวตรวจสอบจากภาพรวมการปฏิบัติการ', href: '/dashboard', action: 'เปิดภาพรวม', status: 'พร้อมใช้งาน', tone: 'success' },
  { title: 'AML', description: 'ตรวจรูปแบบฝากถอนผิดปกติ ยอดสูง ความถี่สูง และรายการที่ต้องบันทึกเหตุผลการตรวจสอบ', href: '/aml', action: 'เปิด AML Center', status: 'มีศูนย์เฉพาะแล้ว', tone: 'success' },
  { title: 'Blacklist', description: 'ติดตามสมาชิกหรือข้อมูลที่ถูกเฝ้าระวัง พร้อมเปิดรายละเอียดสมาชิกและหลักฐานที่เกี่ยวข้อง', href: '/blacklist', action: 'เปิด Watchlist', status: 'มีศูนย์เฉพาะแล้ว', tone: 'success' },
  { title: 'Alerts', description: 'กรองตามระดับความรุนแรง สถานะ ประเภท ผู้ให้บริการ และช่วงวันที่ พร้อม bulk action', href: '/risk-alerts', action: 'เปิด Risk Alerts', status: 'พร้อมใช้งาน', tone: 'success' },
  { title: 'Timeline', description: 'ดูเหตุการณ์ การมอบหมาย หมายเหตุ และการเปลี่ยนสถานะจากหน้ารายละเอียดของแต่ละเคส', href: '/risk-alerts', action: 'เลือกเคสเพื่อดู Timeline', status: 'อยู่ใน Alert Detail', tone: 'success' },
  { title: 'Investigation', description: 'ตรวจ checklist, metadata, related links, ผู้รับผิดชอบ และบันทึกผลก่อน resolve หรือ dismiss', href: '/risk-alerts?status=REVIEWING', action: 'เปิดงานกำลังตรวจ', status: 'พร้อมใช้งาน', tone: 'success' },
];

export default function RiskOperationsPage() {
  return <AdminPage eyebrow="ความเสี่ยง" title="Risk Operations Center" description="ศูนย์รวมงานความเสี่ยง ตั้งแต่ตรวจพบ จัดลำดับ มอบหมาย ตรวจสอบหลักฐาน ไปจนถึงปิดเคส" actions={<AdminLinkButton href="/risk-alerts" tone="primary">เปิดคิวความเสี่ยง</AdminLinkButton>}>
    <section className="admin-risk-operations">
      <AdminMetricGrid><AdminMetric title="โมดูลงาน" value="6" helper="เชื่อมจากศูนย์เดียว" /><AdminMetric title="Alert workflow" value="พร้อม" helper="กรอง มอบหมาย และปิดเคส" tone="success" /><AdminMetric title="AML / Watchlist" value="พร้อม" helper="มีหน้าตรวจเฉพาะทาง" tone="success" /><AdminMetric title="Investigation" value="พร้อม" helper="Checklist และ Metadata" tone="success" /></AdminMetricGrid>
      <div className="admin-risk-operations__grid">{AREAS.map((area) => <article className="admin-risk-operations__card" key={area.title}><div><h2>{area.title}</h2><p>{area.description}</p></div><div className="admin-risk-operations__links"><AdminLinkButton href={area.href} tone="secondary">{area.action}</AdminLinkButton></div><div className="admin-risk-operations__status"><span>สถานะ</span><AdminBadge tone={area.tone}>{area.status}</AdminBadge></div></article>)}</div>
      <AdminCard title="ขั้นตอนตรวจสอบมาตรฐาน" description="ทุกเคสควรมีเจ้าของงาน หลักฐาน และเหตุผลก่อนปิด"><div className="admin-risk-operations__flow"><FlowStep title="1. ตรวจพบ" description="ระบบสร้าง Alert หรือผู้ดูแลเริ่มสแกนรายการผิดปกติ" /><FlowStep title="2. จัดลำดับ" description="เรียง Critical และ High ก่อน พร้อมกรองประเภทที่เกี่ยวข้อง" /><FlowStep title="3. สืบสวน" description="มอบหมายผู้รับผิดชอบ ตรวจ Metadata, Timeline และ Related Links" /><FlowStep title="4. ปิดเคส" description="บันทึกผลและเหตุผล แล้ว Resolve หรือ Dismiss ตามหลักฐาน" /></div></AdminCard>
      <AdminCard title="ข้อกำหนดก่อนปิดเคส" description="รายการความเสี่ยงไม่ควรถูกปิดเพียงเพื่อทำให้ตัวเลขบน Dashboard ดูดี"><AdminStack><Requirement label="มีผู้รับผิดชอบ" /><Requirement label="ตรวจสมาชิกและรายการอ้างอิงแล้ว" /><Requirement label="มีหมายเหตุผลการตรวจสอบ" /><Requirement label="Critical และ High มีหลักฐานรองรับการตัดสินใจ" /></AdminStack></AdminCard>
    </section>
  </AdminPage>;
}

function FlowStep({ title, description }: { title: string; description: string }) { return <article className="admin-risk-operations__step"><strong>{title}</strong><small>{description}</small></article>; }
function Requirement({ label }: { label: string }) { return <div className="admin-risk-operations__status"><span>{label}</span><AdminBadge tone="success">บังคับใช้ใน Workflow</AdminBadge></div>; }
