'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminFilterBar,
  AdminLinkButton,
  AdminMetric,
  AdminMetricGrid,
  AdminPage,
  AdminSkeleton,
} from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';
import { AdminWorkspaceTabs } from '../../../src/features/admin-modernization/workspace-tabs';
import { useAdminPermissions } from '../../../src/features/cms/use-admin-permissions';
import styles from './settings-workspace.module.css';

type SettingsSectionId = 'general' | 'experience' | 'operations' | 'advanced';
type SettingsImpact = 'normal' | 'operational' | 'sensitive';
type LocalizedText = Record<AdminLocale, string>;
type SettingsItem = {
  id: string;
  section: SettingsSectionId;
  href: string;
  permissionBase: string;
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
  { id: 'general', label: { th: 'ทั่วไป', en: 'General' }, shortLabel: { th: 'ทั่วไป', en: 'General' }, description: { th: 'ข้อมูลเว็บไซต์ ช่องทางติดต่อ SEO และเอกสารหลัก', en: 'Website information, contact channels, SEO, and core documents' } },
  { id: 'experience', label: { th: 'แบรนด์และประสบการณ์', en: 'Brand & experience' }, shortLabel: { th: 'แบรนด์', en: 'Experience' }, description: { th: 'แบรนด์ ไอคอน ธีม Content Center และ Promotion Center', en: 'Branding, icons, theme, Content Center, and Promotion Center' } },
  { id: 'operations', label: { th: 'การปฏิบัติการ', en: 'Operations' }, shortLabel: { th: 'ปฏิบัติการ', en: 'Operations' }, description: { th: 'Maintenance และ Feature Flags ที่เปลี่ยนพฤติกรรมระบบทันที', en: 'Maintenance and feature flags that change system behavior immediately' } },
  { id: 'advanced', label: { th: 'ขั้นสูงและข้อมูลสำคัญ', en: 'Advanced & sensitive' }, shortLabel: { th: 'ขั้นสูง', en: 'Advanced' }, description: { th: 'Tracking และ Custom Scripts สำหรับผู้ดูแลระดับสูง', en: 'Tracking and custom scripts for privileged administrators' } },
];

const ITEMS: readonly SettingsItem[] = [
  item('website', 'general', '/settings/website', 'settings.website', 'ข้อมูลเว็บไซต์', 'Website information', 'ชื่อ โดเมน ภาษา สถานะระบบ และข้อความ Member', 'Names, domains, locale, system state, and Member copy', 'เว็บไซต์', 'Website'),
  item('contact', 'general', '/settings/contact', 'settings.contact', 'ช่องทางติดต่อ', 'Contact channels', 'ข้อมูลบริษัท ฝ่ายช่วยเหลือ และลิงก์โซเชียล', 'Company details, support channels, and social links', 'ช่วยเหลือ', 'Support'),
  item('seo', 'general', '/settings/seo', 'settings.seo', 'SEO และการแชร์', 'SEO & sharing', 'Metadata, canonical, robots และ social preview', 'Metadata, canonical, robots, and social previews', 'การค้นหา', 'Search'),
  item('legal', 'general', '/settings/legal', 'settings.legal', 'ข้อกำหนดและนโยบาย', 'Legal documents', 'ข้อกำหนด ความเป็นส่วนตัว คุกกี้ และการเผยแพร่', 'Terms, privacy, cookies, and publication details', 'กฎหมาย', 'Legal', 'sensitive'),

  item('branding', 'experience', '/settings/branding', 'settings.branding', 'แบรนด์', 'Branding', 'โลโก้ สี รูปทรง ฟอนต์ และ workflow Publish', 'Logos, colors, shape, fonts, and publish workflow', 'แบรนด์', 'Brand', 'sensitive'),
  item('icons', 'experience', '/settings/icons', 'settings.branding', 'ไอคอน', 'Icons', 'อัปโหลด Preview และเปลี่ยนไอคอน Member ตามพื้นที่ใช้งาน', 'Upload, preview, and replace Member icons by surface', 'ไอคอน', 'Icons'),
  item('theme', 'experience', '/settings/theme', 'settings.theme', 'ธีมและการจัดวาง', 'Theme & layout', 'โครงหน้า การนำทาง จำนวนคอลัมน์ และ motion', 'Layout, navigation, grid columns, and motion', 'หน้าจอ', 'Screens'),
  item('content-center', 'experience', '/content-center', 'settings.features', 'Content Center', 'Content Center', 'Asset Library, banners, popup, ข่าว กิจกรรม และ FAQ', 'Asset Library, banners, popups, news, events, and FAQs', 'CMS', 'CMS', 'operational'),
  item('promotion-center', 'experience', '/promotion-center', 'settings.features', 'Promotion Center', 'Promotion Center', 'โปรโมชัน เงื่อนไข Desktop/Mobile media และ lifecycle', 'Campaigns, conditions, responsive media, and lifecycle', 'โปรโมชัน', 'Promotions', 'operational'),

  item('maintenance', 'operations', '/settings/maintenance', 'settings.maintenance', 'โหมดปิดปรับปรุง', 'Maintenance mode', 'หยุดบริการเป็นรายส่วน พร้อมช่วงเวลาและผลกระทบ', 'Pause services by scope with schedules and impact review', 'ปฏิบัติการ', 'Operations', 'sensitive'),
  item('features', 'operations', '/settings/features', 'settings.features', 'การเปิดปิดฟีเจอร์', 'Feature controls', 'เปิดหรือปิดความสามารถ Member โดยไม่ deploy ใหม่', 'Enable or disable Member capabilities without deployment', 'การเผยแพร่', 'Release', 'sensitive'),

  item('scripts', 'advanced', '/settings/scripts', 'settings.scripts', 'Tracking และ Custom Scripts', 'Tracking & custom scripts', 'Analytics, pixels และ code ที่ต้องตรวจสอบความปลอดภัย', 'Analytics, pixels, and code requiring security review', 'ข้อมูลสำคัญ', 'Sensitive', 'sensitive'),
];

function item(id: string, section: SettingsSectionId, href: string, permissionBase: string, titleTh: string, titleEn: string, descriptionTh: string, descriptionEn: string, badgeTh: string, badgeEn: string, impact: SettingsImpact = 'normal'): SettingsItem {
  return { id, section, href, permissionBase, title: { th: titleTh, en: titleEn }, description: { th: descriptionTh, en: descriptionEn }, badge: { th: badgeTh, en: badgeEn }, impact };
}

export default function SettingsPage() {
  const [locale] = useAdminLocale();
  const permission = useAdminPermissions();
  const searchParams = useSearchParams();
  const activeSection = normalizeSection(searchParams.get('section'));
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();

  const allowedItems = useMemo(() => ITEMS.filter((settingsItem) => (
    permission.can(`${settingsItem.permissionBase}.view`) || permission.can(`${settingsItem.permissionBase}.update`)
  )), [permission]);

  const visibleItems = useMemo(() => allowedItems.filter((settingsItem) => {
    const sectionMatches = needle || settingsItem.section === activeSection;
    if (!sectionMatches) return false;
    if (!needle) return true;
    return [settingsItem.title.th, settingsItem.title.en, settingsItem.description.th, settingsItem.description.en, settingsItem.badge.th, settingsItem.badge.en, settingsItem.href]
      .some((value) => value.toLowerCase().includes(needle));
  }), [activeSection, allowedItems, needle]);

  const groupedItems = useMemo(() => SECTIONS.map((section) => ({
    section,
    items: visibleItems.filter((settingsItem) => settingsItem.section === section.id),
  })).filter((group) => group.items.length > 0), [visibleItems]);

  const sensitiveCount = allowedItems.filter((settingsItem) => settingsItem.impact === 'sensitive').length;
  const operationalCount = allowedItems.filter((settingsItem) => settingsItem.impact === 'operational').length;
  const copy = locale === 'th' ? {
    eyebrow: 'การดูแลระบบ', title: 'การตั้งค่า', description: 'เปิดเฉพาะหน้าที่บัญชีมีสิทธิ์ และแยกค่าทั่วไป ปฏิบัติการ กับข้อมูลสำคัญให้ชัดเจน',
    search: 'ค้นหาการตั้งค่า', searchDescription: 'ค้นหาจากชื่อ หมวด คำอธิบาย หรือ URL', placeholder: 'เช่น Content Center, maintenance หรือ scripts', clear: 'ล้างคำค้น',
    result: (visible: number, total: number) => `${visible.toLocaleString('th-TH')}/${total.toLocaleString('th-TH')} หน้า`,
    pages: 'หน้าที่เข้าถึงได้', sections: 'หมวด', sensitive: 'การตั้งค่าสำคัญ', operational: 'หน้าปฏิบัติการ',
    noResults: 'ไม่พบการตั้งค่าที่เข้าถึงได้', noResultsHelp: 'ลองใช้คำค้นอื่น หรือบัญชีนี้อาจไม่มีสิทธิ์ในหมวดดังกล่าว', open: 'เปิดหน้า', normal: 'ทั่วไป', operationalLabel: 'ปฏิบัติการ', sensitiveLabel: 'สำคัญ',
  } : {
    eyebrow: 'Administration', title: 'Settings', description: 'Show only destinations allowed for this account and separate general, operational, and sensitive controls.',
    search: 'Search settings', searchDescription: 'Search by title, category, description, or URL.', placeholder: 'For example Content Center, maintenance, or scripts', clear: 'Clear search',
    result: (visible: number, total: number) => `${visible.toLocaleString('en-US')}/${total.toLocaleString('en-US')} pages`,
    pages: 'Accessible pages', sections: 'Sections', sensitive: 'Sensitive settings', operational: 'Operational pages',
    noResults: 'No accessible settings found', noResultsHelp: 'Try another search or this account may not have access to that section.', open: 'Open page', normal: 'General', operationalLabel: 'Operational', sensitiveLabel: 'Sensitive',
  };
  const numberLocale = locale === 'th' ? 'th-TH' : 'en-US';

  if (!permission.ready) return <AdminPage eyebrow={copy.eyebrow} title={copy.title} description={copy.description}><AdminSkeleton lines={10} /></AdminPage>;

  return <AdminPage eyebrow={copy.eyebrow} title={copy.title} description={copy.description}>
    <AdminWorkspaceTabs
      ariaLabel={copy.title}
      queryKey="section"
      activeId={activeSection}
      tabs={SECTIONS.map((section) => ({ id: section.id, label: section.label[locale], shortLabel: section.shortLabel[locale], value: section.id, count: allowedItems.filter((settingsItem) => settingsItem.section === section.id).length }))}
    />

    <div className={styles.workspace}>
      <AdminMetricGrid>
        <AdminMetric title={copy.pages} value={allowedItems.length.toLocaleString(numberLocale)} />
        <AdminMetric title={copy.sections} value={SECTIONS.filter((section) => allowedItems.some((settingsItem) => settingsItem.section === section.id)).length.toLocaleString(numberLocale)} />
        <AdminMetric title={copy.sensitive} value={sensitiveCount.toLocaleString(numberLocale)} tone="warning" />
        <AdminMetric title={copy.operational} value={operationalCount.toLocaleString(numberLocale)} />
      </AdminMetricGrid>

      <AdminCard title={copy.search} description={copy.searchDescription}>
        <AdminFilterBar resultText={copy.result(visibleItems.length, allowedItems.length)}>
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
  return value === 'experience' || value === 'operations' || value === 'advanced' ? value : 'general';
}
