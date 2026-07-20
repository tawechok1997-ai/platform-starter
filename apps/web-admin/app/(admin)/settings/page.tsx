'use client';

import { useMemo, useState } from 'react';
import { AdminActionStrip, AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminFilterBar, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminPage, AdminStack } from '../_components/admin-ui';

type SettingsItem = [title: string, href: string, description: string, badge: string];

const websiteItems: SettingsItem[] = [
  ['ข้อมูลเว็บไซต์', '/settings/website', 'ข้อมูลเว็บหลัก ภาษา โดเมน และสถานะเข้าสู่ระบบหรือสมัครสมาชิก', 'เว็บไซต์'],
  ['แบรนด์', '/settings/branding', 'โลโก้ สีหลัก ไอคอน และตัวอย่างหน้าตาของแบรนด์', 'แบรนด์'],
  ['ไอคอน', '/settings/icons', 'ไอคอนเมนู ทางลัด และแถบนำทางด้านล่างของสมาชิก', 'ไอคอน'],
  ['ธีมและหน้าจอ', '/settings/theme', 'รูปแบบหน้าสมาชิกบนมือถือ เดสก์ท็อป และหน้าเกม', 'หน้าจอ'],
  ['การค้นหาและแชร์', '/settings/seo', 'ข้อมูลสำหรับเครื่องมือค้นหา แผนผังเว็บไซต์ robots และตัวอย่างเวลาแชร์', 'การตลาด'],
  ['ช่องทางติดต่อ', '/settings/contact', 'LINE, Telegram, Facebook, อีเมล และช่องทางช่วยเหลือ', 'ช่วยเหลือ'],
  ['โหมดปิดปรับปรุง', '/settings/maintenance', 'เปิดหรือปิดเว็บ ฝากเงิน ถอนเงิน และค่ายเกมชั่วคราว', 'ปฏิบัติการ'],
  ['สคริปต์ติดตามผล', '/settings/scripts', 'ระบบวิเคราะห์ พิกเซล และสคริปต์เพิ่มเติม', 'ติดตามผล'],
  ['การเปิดปิดฟีเจอร์', '/settings/features', 'เปิดหรือปิดฟีเจอร์โดยไม่ต้องนำระบบขึ้นใหม่', 'การเผยแพร่'],
  ['เอกสารทางกฎหมาย', '/settings/legal', 'ข้อกำหนด ความเป็นส่วนตัว คุกกี้ และนโยบายต่าง ๆ', 'กฎหมาย'],
];

const moneyItems: SettingsItem[] = [
  ['ภาพรวมการเงิน', '/finance', 'ยอดเงินรวม คิวที่รอดำเนินการ และรายการล่าสุด', 'การเงิน'],
  ['ตรวจรายการฝากเงิน', '/topups', 'ตรวจหลักฐานและอนุมัติรายการฝากเงิน', 'คิวงาน'],
  ['ตรวจรายการถอนเงิน', '/withdrawals', 'ตรวจ อนุมัติ และปิดรายการถอนเงิน', 'คิวงาน'],
  ['บัญชีแยกประเภท', '/ledgers', 'ประวัติเงินฝาก ถอน โอน ปรับยอด และยอดก่อนหรือหลัง', 'ตรวจสอบ'],
  ['กระเป๋าเงินสมาชิก', '/wallets', 'ค้นหากระเป๋าเงินสมาชิกและดูยอดคงเหลือ', 'กระเป๋าเงิน'],
  ['รายการความเสี่ยง', '/risk-alerts', 'ตรวจพฤติกรรมเสี่ยงและรายการผิดปกติจากระบบการเงิน', 'ความเสี่ยง'],
];

const gameItems: SettingsItem[] = [
  ['ค่ายเกม', '/game-providers', 'จัดการค่ายเกม สถานะ โลโก้ ประเภทเกม และโหมดปิดปรับปรุง', 'ค่ายเกม'],
  ['การเชื่อมต่อ API เกม', '/game-api-settings', 'ปลายทาง API ข้อมูลลับ Webhook ระยะรอ การลองใหม่ และการตรวจสถานะ', 'API'],
  ['รายการเกม', '/games', 'ซิงก์รายชื่อเกม รูป หมวดหมู่ ป้ายกำกับ และการแสดงผลแก่สมาชิก', 'คลังเกม'],
  ['ตัวเชื่อมค่ายเกม', '/provider-adapters', 'การเปิดเกม ตรวจยอด โอนเงิน ซิงก์ยอด และรับ Webhook', 'ตัวเชื่อม'],
];

const safetyItems: SettingsItem[] = [
  ['สิทธิ์การเข้าถึง', '/access', 'จัดบทบาทและสิทธิ์สำหรับการเงิน ฝ่ายช่วยเหลือ ผู้ดูแลเกม และผู้ตรวจสอบ', 'สิทธิ์'],
  ['ความปลอดภัยผู้ดูแล', '/security', 'เซสชัน การยืนยันสองขั้นตอน และความปลอดภัยของบัญชีผู้ดูแล', 'ความปลอดภัย'],
  ['บันทึกกิจกรรมผู้ดูแล', '/audit', 'ตรวจประวัติการทำรายการ การเงิน การตั้งค่า และการแก้ไขสิทธิ์', 'ตรวจสอบ'],
  ['ลำดับเหตุการณ์', '/activity', 'ดูเหตุการณ์ในระบบและกรองข้อมูลเพื่อตรวจสอบย้อนหลัง', 'กิจกรรม'],
];

export default function SettingsPage() {
  const [query, setQuery] = useState('');
  const sections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filter = (items: SettingsItem[]) => !needle ? items : items.filter(([title, href, description, badge]) => `${title} ${href} ${description} ${badge}`.toLowerCase().includes(needle));
    return [
      { title: 'เว็บไซต์และแบรนด์', items: filter(websiteItems), accent: false },
      { title: 'การเงินและคิวงาน', items: filter(moneyItems), accent: true },
      { title: 'เกมและการเชื่อมต่อ', items: filter(gameItems), accent: true },
      { title: 'ความปลอดภัยและการกำกับดูแล', items: filter(safetyItems), accent: false },
    ];
  }, [query]);
  const visibleCount = sections.reduce((sum, section) => sum + section.items.length, 0);
  const totalCount = websiteItems.length + moneyItems.length + gameItems.length + safetyItems.length;

  return <AdminPage eyebrow="ศูนย์ควบคุมผู้ดูแล" title="การตั้งค่า" description="รวมการตั้งค่าเว็บไซต์ การเงิน เกม การเชื่อมต่อ และความปลอดภัยไว้ในหน้าเดียว">
    <AdminMetricGrid>
      <AdminMetric title="เว็บไซต์และแบรนด์" value={String(websiteItems.length)} helper="เว็บไซต์ ไอคอน การค้นหา ช่องทางติดต่อ และฟีเจอร์" />
      <AdminMetric title="การเงิน" value={String(moneyItems.length)} helper="คิวงาน กระเป๋าเงิน บัญชีแยกประเภท และความเสี่ยง" />
      <AdminMetric title="เกมและ API" value={String(gameItems.length)} helper="ค่ายเกม API รายการเกม และตัวเชื่อม" />
      <AdminMetric title="ความปลอดภัย" value={String(safetyItems.length)} helper="สิทธิ์ บันทึกกิจกรรม และลำดับเหตุการณ์" />
    </AdminMetricGrid>

    <AdminCard title="ค้นหาการตั้งค่า" description="ค้นหาจากชื่อหมวด หน้า หรือคำอธิบาย">
      <AdminFilterBar resultText={`${visibleCount}/${totalCount} หน้า`}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="เช่น ปิดปรับปรุง ความเสี่ยง หรือ API เกม" aria-label="ค้นหาการตั้งค่า" />
        {query && <AdminButton size="compact" tone="ghost" onClick={() => setQuery('')}>ล้างคำค้น</AdminButton>}
      </AdminFilterBar>
    </AdminCard>

    <AdminCard title="ทางลัดสำคัญ" description="หน้าที่มีผลต่อระบบจริง การเงิน ค่ายเกม และข้อมูลลับ">
      <AdminActionStrip><AdminLinkButton href="/settings/icons">ไอคอน</AdminLinkButton><AdminLinkButton href="/game-providers">ค่ายเกม</AdminLinkButton><AdminLinkButton href="/game-api-settings">API เกม</AdminLinkButton><AdminLinkButton href="/games">รายการเกม</AdminLinkButton><AdminLinkButton href="/settings/maintenance">ปิดปรับปรุง</AdminLinkButton></AdminActionStrip>
    </AdminCard>

    {sections.map((section) => section.items.length > 0 && <SettingsSection key={section.title} title={section.title} items={section.items} accent={section.accent} />)}
    {visibleCount === 0 && <AdminEmpty>ไม่พบการตั้งค่า ลองค้นหาคำที่กว้างขึ้น เช่น “เกม” “เงิน” หรือ “ความปลอดภัย”</AdminEmpty>}
  </AdminPage>;
}

function SettingsSection({ title, items, accent = false }: { title: string; items: SettingsItem[]; accent?: boolean }) {
  return <AdminStack><h2 className="admin-ui-section-title">{title}</h2><AdminGrid>{items.map(([cardTitle, href, description, badge]) => <HubCard key={href} title={cardTitle} href={href} description={description} badge={badge} accent={accent} />)}</AdminGrid></AdminStack>;
}

function HubCard({ title, href, description, badge, accent = false }: { title: string; href: string; description: string; badge: string; accent?: boolean }) {
  return <AdminCard title={title} description={description} action={<AdminBadge tone={accent ? 'warning' : 'neutral'}>{badge}</AdminBadge>}><AdminLinkButton href={href}>เปิดหน้า</AdminLinkButton></AdminCard>;
}
