import { AdminBadge, AdminCard, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const checks = [
  ['Rapid movement', 'ฝากแล้วถอนเร็วผิดปกติ', '/risk-alerts?type=RAPID_DEPOSIT_WITHDRAWAL'],
  ['High withdrawal', 'ยอดถอนสูงกว่าพฤติกรรมปกติ', '/risk-alerts?type=HIGH_WITHDRAWAL'],
  ['Repeated top-ups', 'ฝากซ้ำหลายครั้งในช่วงสั้น', '/risk-alerts?type=REPEATED_TOPUPS'],
  ['Ledger mismatch', 'ยอดกระเป๋าและบัญชีแยกประเภทไม่ตรง', '/risk-alerts?type=WALLET_LEDGER_MISMATCH'],
] as const;

export default function AmlPage() {
  return <AdminPage eyebrow="ความเสี่ยง" title="AML Review Center" description="คิวตรวจสอบรูปแบบธุรกรรมผิดปกติ พร้อมทางลัดเข้าสู่หลักฐานและ Alert ที่เกี่ยวข้อง" actions={<AdminLinkButton href="/risk-alerts" tone="primary">เปิด Alerts ทั้งหมด</AdminLinkButton>}>
    <AdminMetricGrid>
      <AdminMetric title="รูปแบบที่ตรวจ" value="4" helper="ธุรกรรมหลักที่ต้องเฝ้าระวัง" />
      <AdminMetric title="หลักฐานขั้นต่ำ" value="3" helper="สมาชิก รายการ และ Timeline" />
      <AdminMetric title="งานเร่งด่วน" value="Critical / High" helper="ตรวจเป็นลำดับแรก" tone="warning" />
      <AdminMetric title="สถานะ" value="พร้อมใช้งาน" helper="เชื่อม Risk Alerts" tone="success" />
    </AdminMetricGrid>
    <AdminCard title="AML Investigation Queue" description="เลือกประเภทเพื่อตรวจรายการที่เข้าเงื่อนไข">
      <AdminStack>{checks.map(([title, description, href]) => <AdminRow key={title}><div><strong>{title}</strong><div style={{ color: '#94a3b8', marginTop: 4 }}>{description}</div></div><AdminLinkButton href={href} tone="secondary">เปิดคิว</AdminLinkButton></AdminRow>)}</AdminStack>
    </AdminCard>
    <AdminCard title="เกณฑ์ก่อนปิดเคส" description="ป้องกันการปิด Alert เพียงเพื่อให้ตัวเลขบน Dashboard ดูสงบเกินจริง">
      <AdminStack>{['ยืนยันเจ้าของบัญชีและสมาชิก', 'ตรวจรายการฝาก ถอน และยอดคงเหลือ', 'อ่าน Timeline และหมายเหตุเดิม', 'บันทึกเหตุผล Resolve หรือ Dismiss'].map((item) => <AdminRow key={item}><span>{item}</span><AdminBadge tone="success">ต้องตรวจ</AdminBadge></AdminRow>)}</AdminStack>
    </AdminCard>
  </AdminPage>;
}
