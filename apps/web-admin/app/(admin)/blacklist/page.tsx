import { AdminBadge, AdminCard, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const sources = [
  ['สมาชิก', 'บัญชีที่ต้องเฝ้าระวังหรือระงับการทำรายการ', '/members'],
  ['บัญชีธนาคาร', 'เลขบัญชีหรือเจ้าของบัญชีที่เคยเชื่อมกับเคสเสี่ยง', '/risk-alerts?type=BANK_CHANGE_WITHDRAWAL'],
  ['สลิปซ้ำ', 'หลักฐานฝากเงินที่ถูกใช้ซ้ำหรือมีลักษณะใกล้เคียง', '/risk-alerts?type=DUPLICATE_DEPOSIT_SLIP'],
  ['รายการซ้ำหลายครั้ง', 'รูปแบบการใช้หลักฐานเดิมซ้ำอย่างต่อเนื่อง', '/risk-alerts?type=REPEATED_DUPLICATE_DEPOSIT_SLIP'],
] as const;

export default function BlacklistPage() {
  return <AdminPage eyebrow="ความเสี่ยง" title="Blacklist & Watchlist" description="ศูนย์ตรวจข้อมูลที่ต้องเฝ้าระวัง โดยเชื่อมสมาชิก บัญชีธนาคาร หลักฐาน และ Alert ไว้ใน workflow เดียว" actions={<AdminLinkButton href="/risk-alerts" tone="primary">เปิด Risk Alerts</AdminLinkButton>}>
    <AdminMetricGrid>
      <AdminMetric title="แหล่งข้อมูล" value="4" helper="สมาชิก บัญชี สลิป และเหตุการณ์" />
      <AdminMetric title="การตัดสินใจ" value="Review first" helper="ต้องมีหลักฐานก่อนระงับ" tone="warning" />
      <AdminMetric title="Audit trail" value="บังคับใช้" helper="เก็บเหตุผลทุกการเปลี่ยนแปลง" tone="success" />
      <AdminMetric title="สถานะ" value="พร้อมตรวจ" helper="ใช้ข้อมูลจากระบบเดิม" tone="success" />
    </AdminMetricGrid>
    <AdminCard title="Watchlist Sources" description="เปิดข้อมูลต้นทางเพื่อยืนยันก่อนเพิ่มหรือคงสถานะเฝ้าระวัง">
      <AdminStack>{sources.map(([title, description, href]) => <AdminRow key={title}><div><strong>{title}</strong><div style={{ color: '#94a3b8', marginTop: 4 }}>{description}</div></div><AdminLinkButton href={href} tone="secondary">ตรวจข้อมูล</AdminLinkButton></AdminRow>)}</AdminStack>
    </AdminCard>
    <AdminCard title="ข้อกำหนดการใช้งาน" description="ลด false positive และป้องกันการระงับสมาชิกจากข้อมูลไม่ครบ">
      <AdminStack>{['ตรวจตัวตนและข้อมูลอ้างอิงอย่างน้อยสองแหล่ง', 'ระบุระดับความเสี่ยงและเหตุผล', 'กำหนดผู้รับผิดชอบและวันทบทวน', 'บันทึกการปลดสถานะพร้อมหลักฐาน'].map((item) => <AdminRow key={item}><span>{item}</span><AdminBadge tone="success">บังคับตรวจ</AdminBadge></AdminRow>)}</AdminStack>
    </AdminCard>
  </AdminPage>;
}
