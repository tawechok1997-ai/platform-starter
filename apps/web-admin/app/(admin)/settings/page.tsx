'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminFilterBar, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminPage } from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';
import { AdminWorkspaceTabs } from '../../../src/features/admin-modernization/workspace-tabs';
import styles from './settings-workspace.module.css';

type SettingsSectionId = 'general' | 'experience' | 'finance' | 'providers' | 'security' | 'advanced';
type SettingsImpact = 'normal' | 'operational' | 'sensitive';
type LocalizedText = Record<AdminLocale, string>;
type SettingsItem = {
  id: string;
  section: SettingsSectionId;
  href: string;
  title: LocalizedText;
  description: LocalizedText;
  badge: LocalizedText;
  impact: SettingsImpact;
};

type SectionDefinition = {
  id: SettingsSectionId;
  label: LocalizedText;
  shortLabel: LocalizedText;
  description: LocalizedText;
};

const SECTIONS: readonly SectionDefinition[] = [
  { id: 'general', label: { th: 'ทั่วไป', en: 'General' }, shortLabel: { th: 'ทั่วไป', en: 'General' }, description: { th: 'ข้อมูลเว็บไซต์ ช่องทางติดต่อ และนโยบายหลัก', en: 'Website information, contact channels, and core policies' } },
  { id: 'experience', label: { th: 'แบรนด์และหน้าจอ', en: 'Brand & experience' }, shortLabel: { th: 'หน้าจอ', en: 'Experience' }, description: { th: 'แบรนด์ ไอคอน ธีม และการแสดงผลสมาชิก', en: 'Branding, icons, themes, and member presentation' } },
  { id: 'finance', label: { th: 'การเงิน', en: 'Finance' }, shortLabel: { th: 'การเงิน', en: 'Finance' }, description: { th: 'ทางลัดไปคิวงาน กระเป๋าเงิน และการตรวจสอบ', en: 'Shortcuts to queues, wallets, and financial review' } },
  { id: 'providers', label: { th: 'เกมและผู้ให้บริการ', en: 'Games & providers' }, shortLabel: { th: 'ค่ายเกม', en: 'Providers' }, description: { th: 'ค่ายเกม API เกม ตัวเชื่อม และรายการเกม', en: 'Providers, game APIs, adapters, and game catalog' } },
  { id: 'security', label: { th: 'สิทธิ์และความปลอดภัย', en: 'Access & security' }, shortLabel: { th: 'ความปลอดภัย', en: 'Security' }, description: { th: 'สิทธิ์ เซสชัน Audit และเหตุการณ์ระบบ', en: 'Permissions, sessions, audit, and system events' } },
  { id: 'advanced', label: { th: 'ขั้นสูง', en: 'Advanced' }, shortLabel: { th: 'ขั้นสูง', en: 'Advanced' }, description: { th: 'Maintenance, scripts และ feature flags ที่มีผลต่อระบบ', en: 'Maintenance, scripts, and feature flags with system impact' } },
];

const ITEMS: readonly SettingsItem[] = [
  item('website', 'general', '/settings/website', 'ข้อมูลเว็บไซต์', 'Website information', 'ภาษา โดเมน สถานะเข้าสู่ระบบ และข้อมูลพื้นฐาน', 'Languages, domains, sign-in state, and core information', 'เว็บไซต์', 'Website'),
  item('contact', 'general', '/settings/contact', 'ช่องทางติดต่อ', 'Contact channels', 'LINE, Telegram, Facebook, อีเมล และช่องทางช่วยเหลือ', 'LINE, Telegram, Facebook, email, and support channels', 'ช่วยเหลือ', 'Support'),
  item('seo', 'general', '/settings/seo', 'การค้นหาและแชร์', 'Search & sharing', 'SEO, sitemap, robots และตัวอย่างเวลาแชร์', 'SEO, sitemap, robots, and social sharing previews', 'การตลาด', 'Marketing'),
  item('legal', 'general', '/settings/legal', 'เอกสารทางกฎหมาย', 'Legal documents', 'ข้อกำหนด ความเป็นส่วนตัว คุกกี้ และนโยบาย', 'Terms, privacy, cookies, and policies', 'กฎหมาย', 'Legal'),

  item('branding', 'experience', '/settings/branding', 'แบรนด์', 'Branding', 'โลโก้ สีหลัก ไอคอน และตัวอย่างแบรนด์', 'Logos, primary colors, icons, and brand preview', 'แบรนด์', 'Brand'),
  item('icons', 'experience', '/settings/icons', 'ไอคอน', 'Icons', 'ไอคอนเมนู ทางลัด และแถบนำทางสมาชิก', 'Menu, shortcut, and member navigation icons', 'ไอคอน', 'Icons'),
  item('theme', 'experience', '/settings/theme', 'ธีมและหน้าจอ', 'Theme & screens', 'รูปแบบมือถือ เดสก์ท็อป และหน้าเกม', 'Mobile, desktop, and game-screen presentation', 'หน้าจอ', 'Screens'),

  item('finance-overview', 'finance', '/finance', 'ภาพรวมการเงิน', 'Finance overview', 'ยอดรวม คิวรอดำเนินการ และรายการล่าสุด', 'Totals, pending queues, and recent transactions', 'ภาพรวม', 'Overview', 'operational'),
  item('topups', 'finance', '/topups', 'ตรวจรายการฝากเงิน', 'Top-up review', 'ตรวจหลักฐานและอนุมัติรายการฝากเงิน', 'Review evidence and approve top-ups', 'คิวงาน', 'Queue', 'operational'),
  item('withdrawals', 'finance', '/withdrawals', 'ตรวจรายการถอนเงิน', 'Withdrawal review', 'ตรวจ อนุมัติ และปิดรายการถอนเงิน', 'Review, approve, and complete withdrawals', 'คิวงาน', 'Queue', 'operational'),
  item('ledgers', 'finance', '/wallet-ledgers', 'ประวัติยอดเงิน', 'Wallet ledger', 'ประวัติเงินเข้าออกและยอดก่อนหรือหลัง', 'Credits, debits, and before/after balances', 'ตรวจสอบ', 'Audit'),
  item('wallets', 'finance', '/wallets', 'กระเป๋าเงินสมาชิก', 'Member wallets', 'ค้นหากระเป๋าเงินและตรวจยอดคงเหลือ', 'Find member wallets and review balances', 'กระเป๋าเงิน', 'Wallets'),
  item('risk-alerts', 'finance', '/risk-alerts', 'รายการความเสี่ยง', 'Risk alerts', 'ตรวจพฤติกรรมเสี่ยงและรายการผิดปกติ', 'Review risky behavior and financial anomalies', 'ความเสี่ยง', 'Risk', 'operational'),

  item('providers', 'providers', '/game-providers', 'ค่ายเกม', 'Game providers', 'สถานะ โลโก้ ประเภทเกม และ maintenance', 'Status, logos, game types, and maintenance', 'ค่ายเกม', 'Providers', 'operational'),
  item('provider-api', 'providers', '/game-api-settings', 'การเชื่อมต่อ API เกม', 'Game API connections', 'Endpoints, secrets, webhooks, timeouts และ retries', 'Endpoints, secrets, webhooks, timeouts, and retries', 'API', 'API', 'sensitive'),
  item('games', 'providers', '/games', 'รายการเกม', 'Game catalog', 'ซิงก์รายชื่อ รูป หมวดหมู่ และการแสดงผล', 'Sync names, assets, categories, and visibility', 'คลังเกม', 'Catalog'),
  item('adapters', 'providers', '/provider-adapters', 'ตัวเชื่อมค่ายเกม', 'Provider adapters', 'เปิดเกม ตรวจยอด โอนเงิน และรับ webhook', 'Launch games, check balances, transfer funds, and receive webhooks', 'ตัวเชื่อม', 'Adapters', 'sensitive'),

  item('access', 'security', '/access', 'สิทธิ์การเข้าถึง', 'Access control', 'บทบาทและสิทธิ์ของผู้ดูแลแต่ละกลุ่มงาน', 'Administrator roles and permissions by workstream', 'สิทธิ์', 'Access', 'sensitive'),
  item('security', 'security', '/security', 'ความปลอดภัยผู้ดูแล', 'Admin security', 'เซสชัน 2FA และ owner recovery', 'Sessions, 2FA, and owner recovery', 'ความปลอดภัย', 'Security', 'sensitive'),
  item('audit', 'security', '/audit', 'บันทึกกิจกรรมผู้ดูแล', 'Audit logs', 'ประวัติการทำรายการ การตั้งค่า และการแก้สิทธิ์', 'History of operations, settings, and access changes', 'ตรวจสอบ', 'Audit'),
  item('activity', 'security', '/activity-center', 'ลำดับเหตุการณ์', 'Activity center', 'เหตุการณ์ล่าสุดและการตรวจสอบย้อนหลัง', 'Recent events and historical review', 'กิจกรรม', 'Activity'),

  item('maintenance', 'advanced', '/settings/maintenance', 'โหมดปิดปรับปรุง', 'Maintenance mode', 'เปิดหรือปิดเว็บ การเงิน และค่ายเกมชั่วคราว', 'Temporarily disable the website, finance, or providers', 'ปฏิบัติการ', 'Operations', 'sensitive'),
  item('scripts', 'advanced', '/settings/scripts', 'สคริปต์ติดตามผล', 'Tracking scripts', 'Analytics, pixels และ scripts เพิ่มเติม', 'Analytics, pixels, and additional scripts', 'ติดตามผล', 'Tracking', 'sensitive'),
  item('features', 'advanced', '/settings/features', 'การเปิดปิดฟีเจอร์', 'Feature controls', 'เปิดหรือปิดฟีเจอร์โดยไม่ deploy ใหม่', 'Enable or disable features without a new deployment', 'การเผยแพร่', 'Release', 'sensitive'),
];

function item(id: string, section: SettingsSectionId, href: string, titleTh: string, titleEn: string, descriptionTh: string, descriptionEn: string, badgeTh: string, badgeEn: string, impact: SettingsImpact = 'normal'): SettingsItem {
  return { id, section, href, title: { th: titleTh, en: titleEn }, description: { th: descriptionTh, en: descriptionEn }, badge: { th: badgeTh, en: badgeEn }, impact };
}

export default function SettingsPage() {
  const [locale] = useAdminLocale();
  const searchParams = useSearchParams();
  const activeSection = normalizeSection(searchParams.get('section'));
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();

  const visibleItems = useMemo(() => ITEMS.filter((settingsItem) => {
    const sectionMatches = needle || settingsItem.section === activeSection;
    if (!sectionMatches) return false;
    if (!needle) return true;
    return [settingsItem.title.th, settingsItem.title.en, settingsItem.description.th, settingsItem.description.en, settingsItem.badge.th, settingsItem.badge.en, settingsItem.href]
      .some((value) => value.toLowerCase().includes(needle));
  }), [activeSection, needle]);

  const groupedItems = useMemo(() => SECTIONS.map((section) => ({
    section,
    items: visibleItems.filter((settingsItem) => settingsItem.section === section.id),
  })).filter((group) => group.items.length > 0), [visibleItems]);

  const sensitiveCount = ITEMS.filter((settingsItem) => settingsItem.impact === 'sensitive').length;
  const operationalCount = ITEMS.filter((settingsItem) => settingsItem.impact === 'operational').length;
  const copy = locale === 'th' ? {
    eyebrow: 'การดูแลระบบ', title: 'การตั้งค่า', description: 'ค้นหาและเปิดการตั้งค่าตามหมวด โดยแยกหน้าปฏิบัติการและหน้าข้อมูลลับให้ชัดเจน',
    search: 'ค้นหาการตั้งค่า', searchDescription: 'ค้นหาจากชื่อ หมวด คำอธิบาย หรือ URL', placeholder: 'เช่น maintenance, API เกม หรือความปลอดภัย', clear: 'ล้างคำค้น',
    result: (visible: number, total: number) => `${visible.toLocaleString('th-TH')}/${total.toLocaleString('th-TH')} หน้า`,
    pages: 'หน้าทั้งหมด', sections: 'หมวด', sensitive: 'ข้อมูลหรือการตั้งค่าสำคัญ', operational: 'หน้าปฏิบัติการ',
    noResults: 'ไม่พบการตั้งค่า', noResultsHelp: 'ลองใช้คำค้นที่กว้างขึ้น หรือเลือกหมวดอื่น', open: 'เปิดหน้า', normal: 'ทั่วไป', operationalLabel: 'ปฏิบัติการ', sensitiveLabel: 'สำคัญ',
  } : {
    eyebrow: 'Administration', title: 'Settings', description: 'Find settings by category, with operational and sensitive destinations clearly separated.',
    search: 'Search settings', searchDescription: 'Search by title, category, description, or URL.', placeholder: 'For example maintenance, game API, or security', clear: 'Clear search',
    result: (visible: number, total: number) => `${visible.toLocaleString('en-US')}/${total.toLocaleString('en-US')} pages`,
    pages: 'Total pages', sections: 'Sections', sensitive: 'Sensitive settings', operational: 'Operational pages',
    noResults: 'No settings found', noResultsHelp: 'Try a broader search or select another section.', open: 'Open page', normal: 'General', operationalLabel: 'Operational', sensitiveLabel: 'Sensitive',
  };
  const numberLocale = locale === 'th' ? 'th-TH' : 'en-US';

  return <AdminPage eyebrow={copy.eyebrow} title={copy.title} description={copy.description}>
    <AdminWorkspaceTabs
      ariaLabel={copy.title}
      queryKey="section"
      activeId={activeSection}
      tabs={SECTIONS.map((section) => ({ id: section.id, label: section.label[locale], shortLabel: section.shortLabel[locale], value: section.id, count: ITEMS.filter((settingsItem) => settingsItem.section === section.id).length }))}
    />

    <div className={styles.workspace}>
      <AdminMetricGrid>
        <AdminMetric title={copy.pages} value={ITEMS.length.toLocaleString(numberLocale)} />
        <AdminMetric title={copy.sections} value={SECTIONS.length.toLocaleString(numberLocale)} />
        <AdminMetric title={copy.sensitive} value={sensitiveCount.toLocaleString(numberLocale)} tone="warning" />
        <AdminMetric title={copy.operational} value={operationalCount.toLocaleString(numberLocale)} />
      </AdminMetricGrid>

      <AdminCard title={copy.search} description={copy.searchDescription}>
        <AdminFilterBar resultText={copy.result(visibleItems.length, ITEMS.length)}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.placeholder} aria-label={copy.search} />
          {query && <AdminButton size="compact" tone="ghost" onClick={() => setQuery('')}>{copy.clear}</AdminButton>}
        </AdminFilterBar>
      </AdminCard>

      {groupedItems.map(({ section, items }) => <section className={styles.section} key={section.id} aria-labelledby={`settings-${section.id}`}>
        <header><div><h2 id={`settings-${section.id}`}>{section.label[locale]}</h2><p>{section.description[locale]}</p></div><AdminBadge>{items.length.toLocaleString(numberLocale)}</AdminBadge></header>
        <div className={styles.grid}>{items.map((settingsItem) => <SettingsCard key={settingsItem.id} settingsItem={settingsItem} locale={locale} openLabel={copy.open} impactLabels={{ normal: copy.normal, operational: copy.operationalLabel, sensitive: copy.sensitiveLabel }} />)}</div>
      </section>)}

      {visibleItems.length === 0 && <div className={styles.empty}><AdminEmpty>{copy.noResults}<small>{copy.noResultsHelp}</small></AdminEmpty></div>}
    </div>
  </AdminPage>;
}

function SettingsCard({ settingsItem, locale, openLabel, impactLabels }: { settingsItem: SettingsItem; locale: AdminLocale; openLabel: string; impactLabels: Record<SettingsImpact, string> }) {
  const tone = settingsItem.impact === 'sensitive' ? 'warning' : 'neutral';
  return <article className={styles.card} data-impact={settingsItem.impact}>
    <AdminCard title={settingsItem.title[locale]} description={settingsItem.description[locale]} action={<span className={styles.badges}><AdminBadge>{settingsItem.badge[locale]}</AdminBadge><AdminBadge tone={tone}>{impactLabels[settingsItem.impact]}</AdminBadge></span>}>
      <AdminLinkButton href={settingsItem.href}>{openLabel}</AdminLinkButton>
    </AdminCard>
  </article>;
}

function normalizeSection(value: string | null): SettingsSectionId {
  return value === 'experience' || value === 'finance' || value === 'providers' || value === 'security' || value === 'advanced' ? value : 'general';
}
