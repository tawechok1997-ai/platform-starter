import { AdminBadge, AdminCard, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';
type QuickStep = readonly [step: string, title: string, description: string, href: string];
type MarketPreset = readonly [title: string, description: string, badge: string, tone: BadgeTone];

const quickSteps: readonly QuickStep[] = [
  ['1', 'เลือก Preset', 'เลือก template ค่ายเกมก่อนเริ่มตั้งค่า ไม่ต้องจำ endpoint เองทั้งหมด', '/provider-presets'],
  ['2', 'Setup Wizard', 'ทำตาม wizard เพื่อสร้าง provider, credential, endpoint และ gate', '/provider-setup-wizard'],
  ['3', 'ตรวจพร้อมใช้งาน', 'เปิดหน้า Risk/Preflight เพื่อเช็ก endpoint, credential, transfer gate และเงินจริง', '/provider-risk'],
];

const simpleFields = [
  ['ชื่อค่าย', 'ชื่อที่แอดมินเห็น เช่น Demo Provider, PG Soft, Pragmatic', 'ต้องมี'],
  ['โหมดกระเป๋า', 'ตลาดจริงส่วนใหญ่ใช้ Transfer Wallet ก่อนเปิดเงินจริง', 'TRANSFER'],
  ['Base URL', 'URL หลักของ API จากค่ายเกม', 'ต้องมี'],
  ['API Key / Secret', 'ข้อมูลลับจากค่ายเกม เก็บแบบ masked', 'ต้องมี'],
  ['Agent / Merchant ID', 'รหัสร้านหรือ agent ที่ค่ายเกมออกให้', 'แล้วแต่ค่าย'],
  ['Webhook Secret', 'ใช้ตรวจ callback/signature จากค่าย', 'แนะนำ'],
] as const;

const marketPresets: readonly MarketPreset[] = [
  ['Demo / Dry-run', 'ใช้ทดสอบ flow launch, transfer, webhook โดยไม่แตะเงินจริง', 'ปลอดภัยสุด', 'success'],
  ['Transfer Wallet', 'สมาชิกโยกเงินเข้าออกเกม ระบบควบคุมยอดก่อนส่ง provider', 'ตลาดนิยม', 'warning'],
  ['Seamless Wallet', 'Provider เรียกเช็กยอดกับระบบตลอด ต้องแข็งก่อนเปิดจริง', 'ขั้นสูง', 'danger'],
];

const advancedItems = [
  ['Launch', 'เปิดเกม'],
  ['Balance', 'เช็กยอด'],
  ['Transfer In', 'โยกเงินเข้าเกม'],
  ['Transfer Out', 'โยกเงินออกเกม'],
  ['Game List', 'ดึงรายการเกม'],
  ['Bet History', 'ดึงประวัติเดิมพัน'],
  ['Webhook', 'รับ callback'],
] as const;

const safetyChecklist = [
  ['Provider ACTIVE', 'ค่ายเกมเปิดใช้งานแล้ว'],
  ['Credential ครบ', 'API key/secret/webhook secret พร้อม'],
  ['Endpoint ครบ', 'launch, balance, transfer-in/out, webhook มี mapping'],
  ['Risk Preflight ผ่าน', 'ไม่มี blocker ก่อนเปิดใช้งาน'],
  ['Real money gate ปิดไว้ก่อน', 'เปิดเฉพาะตอนพร้อม production จริง'],
] as const;

export default function GameApiSettingsPage() {
  return (
    <AdminPage
      eyebrow="Game Platform"
      title="ตั้งค่า API เกม"
      description="หน้าใช้งานจริงแบบตลาด: ตั้งค่าให้น้อยที่สุดก่อน แล้วค่อยเปิดขั้นสูงเมื่อต้อง map endpoint เฉพาะค่าย"
      actions={<><AdminLinkButton href="/provider-setup-wizard" tone="primary">Setup Wizard</AdminLinkButton><AdminLinkButton href="/operations">Operations Hub</AdminLinkButton></>}
    >
      <AdminNotice>แนะนำ: เริ่มจาก Preset + Wizard แล้วเปิด Transfer Wallet ก่อนเสมอ อย่าเปิดเงินจริงจนกว่า Preflight ผ่านครบทุกข้อ เพราะฐานข้อมูลไม่ได้ชอบความตื่นเต้นแบบนั้น</AdminNotice>

      <AdminMetricGrid>
        <AdminMetric title="Setup mode" value="ง่าย" helper="ซ่อน endpoint ขั้นสูงไว้ก่อน" />
        <AdminMetric title="Recommended" value="TRANSFER" helper="เหมือนตลาดทั่วไป เริ่มควบคุมง่าย" />
        <AdminMetric title="Real money" value="ปิดก่อน" helper="เปิดหลัง preflight ผ่าน" />
        <AdminMetric title="Advanced" value="แยกหน้า" helper="สำหรับ mapping รายค่าย" />
      </AdminMetricGrid>

      <AdminToolbar>
        <div><strong>Quick setup</strong><p style={mutedStyle}>ทำตาม 3 ขั้นนี้พอ ไม่ต้องไล่กรอกทุก endpoint ตั้งแต่แรกเหมือนทำข้อสอบราชการ</p></div>
      </AdminToolbar>
      <AdminGrid>{quickSteps.map(([step, title, description, href]) => <AdminCard key={step} title={`${step}. ${title}`} action={<AdminLinkButton href={href}>เปิด</AdminLinkButton>}><p style={mutedStyle}>{description}</p></AdminCard>)}</AdminGrid>

      <h2 style={sectionTitleStyle}>Preset ที่ใช้ในตลาดจริง</h2>
      <AdminGrid>{marketPresets.map(([title, description, badge, tone]) => <AdminCard key={title}><AdminRow><div><strong>{title}</strong><p style={mutedStyle}>{description}</p></div><AdminBadge tone={tone}>{badge}</AdminBadge></AdminRow></AdminCard>)}</AdminGrid>

      <h2 style={sectionTitleStyle}>ข้อมูลที่แอดมินควรเห็นก่อน</h2>
      <AdminCard title="Basic connection" description="ช่องหลักที่ต้องใช้ต่อค่ายเกมจริง ส่วน endpoint ลึก ๆ ให้ไปหน้า Advanced Mapping">
        <AdminStack>{simpleFields.map(([title, description, badge]) => <AdminRow key={title}><div><strong>{title}</strong><p style={mutedStyle}>{description}</p></div><AdminBadge tone={badge === 'ต้องมี' ? 'warning' : badge === 'TRANSFER' ? 'success' : 'neutral'}>{badge}</AdminBadge></AdminRow>)}</AdminStack>
      </AdminCard>

      <h2 style={sectionTitleStyle}>Checklist ก่อนเปิดให้สมาชิกใช้</h2>
      <AdminGrid>{safetyChecklist.map(([title, description], index) => <AdminCard key={title}><AdminRow><div><strong>{title}</strong><p style={mutedStyle}>{description}</p></div><AdminBadge tone={index < 3 ? 'warning' : 'danger'}>{index < 3 ? 'Required' : 'Safety'}</AdminBadge></AdminRow></AdminCard>)}</AdminGrid>

      <h2 style={sectionTitleStyle}>ขั้นสูง: Endpoint Mapping</h2>
      <AdminCard title="Advanced mapping" description="ซ่อนไว้ตรงนี้พอ ใช้เฉพาะตอนค่ายเกมให้เอกสาร API แยก endpoint มา ไม่ควรวางเป็นจุดเริ่มต้นของหน้า">
        <AdminStack>{advancedItems.map(([title, description]) => <AdminRow key={title}><div><strong>{title}</strong><p style={mutedStyle}>{description}</p></div><AdminBadge>Advanced</AdminBadge></AdminRow>)}</AdminStack>
      </AdminCard>

      <h2 style={sectionTitleStyle}>ทางลัดงานจริง</h2>
      <AdminGrid>
        <AdminCard title="Provider Presets" description="เลือก template endpoint/credential ก่อนตั้งค่า" action={<AdminLinkButton href="/provider-presets">เปิด</AdminLinkButton>}><p style={mutedStyle}>เริ่มจาก preset แล้วค่อยกรอกค่าจริง</p></AdminCard>
        <AdminCard title="Provider Risk" description="เช็ก health, gate, preflight และ blocker ก่อนเปิดใช้งาน" action={<AdminLinkButton href="/provider-risk">เปิด</AdminLinkButton>}><p style={mutedStyle}>ใช้หน้านี้เป็นด่านสุดท้ายก่อนเปิดค่ายเกมจริง</p></AdminCard>
        <AdminCard title="Reconciliation Center" description="เทียบยอดระบบกับ provider และ resolve mismatch" action={<AdminLinkButton href="/reconciliation-center">เปิด</AdminLinkButton>}><p style={mutedStyle}>ใช้ตรวจยอดก่อน/หลัง transfer</p></AdminCard>
        <AdminCard title="Webhook Settlement" description="ตรวจ callback ก่อนปล่อยให้ webhook settle wallet" action={<AdminLinkButton href="/webhook-settlement">เปิด</AdminLinkButton>}><p style={mutedStyle}>เปิดแบบ gated ไม่ให้ webhook เขียนเงินมั่ว</p></AdminCard>
        <AdminCard title="Game Transfers" description="ดู transfer-in/out และ retry" action={<AdminLinkButton href="/game-transfers">เปิด</AdminLinkButton>}><p style={mutedStyle}>เหมาะสำหรับไล่ปัญหาโยกเงินเข้าออกเกม</p></AdminCard>
        <AdminCard title="Money Ops" description="ศูนย์รวม alert, scan, simulator และ safety gate" action={<AdminLinkButton href="/money-ops">เปิด</AdminLinkButton>}><p style={mutedStyle}>ใช้ตรวจภาพรวมก่อนเปิดเงินจริง</p></AdminCard>
      </AdminGrid>
    </AdminPage>
  );
}

const sectionTitleStyle = { margin: '24px 0 12px', fontSize: 'clamp(24px, 7vw, 34px)', lineHeight: 1 } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;