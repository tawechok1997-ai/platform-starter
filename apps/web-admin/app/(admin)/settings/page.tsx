'use client';

import { useMemo, useState } from 'react';
import { AdminBadge, AdminCard, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminPage } from '../_components/admin-ui';

type SettingsItem = [title: string, href: string, description: string, badge: string];

const websiteItems: SettingsItem[] = [
  ['Website', '/settings/website', 'ข้อมูลเว็บหลัก ภาษา โดเมน และสถานะ login/register', 'Core'],
  ['Branding', '/settings/branding', 'โลโก้ สีหลัก ไอคอน และตัวอย่างหน้าตาแบรนด์', 'Brand'],
  ['Icons', '/settings/icons', 'ตั้งค่าไอคอนเมนู shortcut และ bottom nav ฝั่งสมาชิก', 'Icon'],
  ['Theme', '/settings/theme', 'Layout ผู้เล่น มือถือ เดสก์ท็อป และเกม', 'UI'],
  ['SEO', '/settings/seo', 'Meta, sitemap, robots และ social preview', 'Growth'],
  ['Contact', '/settings/contact', 'Line, Telegram, Facebook, email และช่องทางช่วยเหลือ', 'Support'],
  ['Maintenance', '/settings/maintenance', 'เปิด/ปิดปรับปรุงเว็บ ฝาก ถอน และ Provider', 'Ops'],
  ['Scripts', '/settings/scripts', 'Analytics, pixels และ custom scripts', 'Tracking'],
  ['Feature Flags', '/settings/features', 'เปิด/ปิดฟีเจอร์โดยไม่ต้อง deploy ใหม่', 'Release'],
  ['Legal Pages', '/settings/legal', 'Terms, Privacy, Cookie และนโยบายต่าง ๆ', 'Legal'],
];

const moneyItems: SettingsItem[] = [
  ['Finance Summary', '/finance', 'ภาพรวมยอดเงินรวม คิว pending และรายการล่าสุด', 'Money'],
  ['Top Up Review', '/topups', 'ตรวจสลิปและอนุมัติรายการฝาก', 'Queue'],
  ['Withdrawal Review', '/withdrawals', 'ตรวจและปิดรายการถอนเงิน', 'Queue'],
  ['Wallet Ledgers', '/ledgers', 'ดูประวัติเงินทั้งหมด ฝาก ถอน และยอดก่อน/หลัง', 'Audit'],
  ['Member Wallets', '/wallets', 'ค้นหา wallet สมาชิกและดูยอดคงเหลือ', 'Wallet'],
  ['Risk Alerts', '/risk-alerts', 'ตรวจพฤติกรรมเสี่ยงและรายการผิดปกติจากระบบเงิน', 'Risk'],
];

const gameItems: SettingsItem[] = [
  ['Game Providers', '/game-providers', 'จัดการค่ายเกม สถานะ โลโก้ ประเภทเกม และ maintenance mode', 'Provider'],
  ['Game API Settings', '/game-api-settings', 'ตั้งค่า endpoint, credential, webhook, timeout, retry และ health check', 'API'],
  ['Game Catalog', '/games', 'sync รายชื่อเกม รูปเกม หมวดหมู่ tag และ member visibility', 'Catalog'],
  ['Provider Adapters', '/provider-adapters', 'สัญญากลางของ adapter: launch, balance, transfer, sync, webhook', 'Adapter'],
];

const safetyItems: SettingsItem[] = [
  ['Access Control', '/access', 'จัด role/permission สำหรับ finance, support, game operator และ auditor', 'Access'],
  ['Admin 2FA', '/security', 'ความปลอดภัยแอดมิน session และ 2FA', 'Security'],
  ['Audit Logs', '/audit', 'ตรวจประวัติ action สำคัญ การเงิน config และ permission', 'Audit'],
  ['Activity', '/activity', 'timeline การกระทำในระบบและ filter สำหรับตรวจสอบย้อนหลัง', 'Activity'],
];

export default function SettingsPage() {
  const [query, setQuery] = useState('');
  const sections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filter = (items: SettingsItem[]) => !needle ? items : items.filter(([title, href, description, badge]) => `${title} ${href} ${description} ${badge}`.toLowerCase().includes(needle));
    return [
      { title: 'Website Settings', items: filter(websiteItems), accent: false },
      { title: 'Money Operations', items: filter(moneyItems), accent: true },
      { title: 'Game Platform Settings', items: filter(gameItems), accent: true },
      { title: 'Security / Governance', items: filter(safetyItems), accent: false },
    ];
  }, [query]);
  const visibleCount = sections.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <AdminPage eyebrow="Admin Console" title="Settings" description="ศูนย์รวมโครงตั้งค่าเว็บ ระบบเงิน เกม API ค่ายเกม ความปลอดภัย และ operation">
      <AdminMetricGrid>
        <AdminMetric title="Website modules" value={String(websiteItems.length)} helper="แบรนด์, icons, SEO, contact, feature flags" />
        <AdminMetric title="Money modules" value={String(moneyItems.length)} helper="คิวเงิน, wallet, ledger, risk" />
        <AdminMetric title="Game modules" value={String(gameItems.length)} helper="providers, API, catalog, adapters" />
        <AdminMetric title="Safety modules" value={String(safetyItems.length)} helper="access, audit, activity" />
      </AdminMetricGrid>

      <section style={quickPanelStyle}>
        <div><h2 style={{ margin: 0 }}>ค้นหาการตั้งค่า</h2><p style={mutedStyle}>พิมพ์ชื่อโมดูล หมวด หรือคำอธิบาย เพื่อกรองรายการโดยไม่ต้องไล่เปิดทีละหน้า</p></div>
        <div style={searchWrapStyle}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="เช่น maintenance, risk, game API" aria-label="ค้นหาการตั้งค่า" style={searchInputStyle} />{query && <button type="button" onClick={() => setQuery('')} style={clearButtonStyle}>ล้าง</button>}</div>
      </section>

      <section style={quickPanelStyle}>
        <div><h2 style={{ margin: 0 }}>Quick actions</h2><p style={mutedStyle}>ทางลัดสำหรับ setting ที่แตะ production, เงิน, provider และ API key โดยตรง</p></div>
        <div style={quickActionsStyle}><AdminLinkButton href="/settings/icons">Icons</AdminLinkButton><AdminLinkButton href="/game-providers">Game Providers</AdminLinkButton><AdminLinkButton href="/game-api-settings">Game API</AdminLinkButton><AdminLinkButton href="/games">Game Catalog</AdminLinkButton><AdminLinkButton href="/settings/maintenance">Maintenance</AdminLinkButton></div>
      </section>

      {sections.map((section) => section.items.length > 0 && <SettingsSection key={section.title} title={section.title} items={section.items} accent={section.accent} />)}
      {visibleCount === 0 && <AdminCard><div style={emptyStyle}><strong>ไม่พบการตั้งค่า</strong><span>ลองใช้คำค้นที่กว้างขึ้น เช่น “game”, “money” หรือ “security”</span></div></AdminCard>}
    </AdminPage>
  );
}

function SettingsSection({ title, items, accent }: { title: string; items: SettingsItem[]; accent?: boolean }) {
  return <><h2 style={sectionTitleStyle}>{title}</h2><AdminGrid>{items.map(([cardTitle, href, description, badge]) => <HubCard key={href} title={cardTitle} href={href} description={description} badge={badge} accent={accent} />)}</AdminGrid></>;
}

function HubCard({ title, href, description, badge, accent }: { title: string; href: string; description: string; badge: string; accent?: boolean }) {
  return <AdminCard><div style={cardStackStyle}><div style={cardTopStyle}><AdminBadge tone={accent ? 'warning' : 'neutral'}>{badge}</AdminBadge><span style={smallMutedStyle}>{accent ? 'Operation' : 'Config'}</span></div><h2 style={{ margin: 0, fontSize: 24 }}>{title}</h2><p style={mutedStyle}>{description}</p><AdminLinkButton href={href}>Open</AdminLinkButton></div></AdminCard>;
}

const sectionTitleStyle = { margin: '24px 0 12px', fontSize: 'clamp(24px, 7vw, 34px)', lineHeight: 1 } as const;
const quickPanelStyle = { border: '1px solid rgba(148,163,184,.18)', background: 'rgba(15,23,42,.58)', borderRadius: 22, padding: 18, display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' as const, alignItems: 'center' };
const quickActionsStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const };
const searchWrapStyle = { display: 'flex', gap: 8, flex: '1 1 320px', maxWidth: 560 } as const;
const searchInputStyle = { minHeight: 44, width: '100%', minWidth: 0, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px' } as const;
const clearButtonStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: 'rgba(148,163,184,.08)', color: '#f8fafc', padding: '0 14px', fontWeight: 800 } as const;
const cardStackStyle = { display: 'grid', gap: 10 } as const;
const cardTopStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const smallMutedStyle = { color: '#64748b', fontSize: 12, fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '.08em' };
const emptyStyle = { display: 'grid', gap: 6, textAlign: 'center' as const, padding: 20 };
