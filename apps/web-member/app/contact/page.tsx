'use client';

import Link from 'next/link';
import { PublicPageShell } from '../components/public-page-shell';
import { useMemberLocale } from '../member-locale-provider';
import { useSiteSettings } from '../site-settings-provider';
import { textSetting } from '../site-settings';

type ContactChannel = readonly [label: string, value: string, href: string];

const COPY = {
  th: { eyebrow: 'ติดต่อ', title: 'ติดต่อเรา', back: 'กลับหน้าแรก', address: 'ที่อยู่', open: 'เปิดช่องทางติดต่อ', empty: 'ยังไม่มีช่องทางติดต่อที่เปิดใช้งาน' },
  en: { eyebrow: 'Contact', title: 'Contact us', back: 'Back to home', address: 'Address', open: 'Open contact channel', empty: 'No contact channel is currently available.' },
} as const;

export default function ContactPage() {
  const { settings, typedSettings } = useSiteSettings();
  const { locale } = useMemberLocale();
  const copy = COPY[locale];
  const { branding, contact, website } = typedSettings;
  const siteName = website.site_name.trim() || 'NOAH345';
  const primaryColor = branding.primary_color || '#f5c542';
  const allChannels: ContactChannel[] = [
    ['LINE', contact.line_oa ?? '', textSetting(settings, 'contact', 'line_url', '')],
    ['Telegram', contact.telegram ?? '', textSetting(settings, 'contact', 'telegram_url', '')],
    ['Facebook', contact.facebook ?? '', textSetting(settings, 'contact', 'facebook_url', '')],
    ['Live Chat', locale === 'th' ? 'ติดต่อทีมช่วยเหลือ' : 'Contact support', contact.live_chat_url ?? ''],
    [locale === 'th' ? 'โทรศัพท์' : 'Phone', contact.phone ?? '', ''],
    [locale === 'th' ? 'อีเมล' : 'Email', contact.email ?? '', ''],
  ];
  const channels = allChannels.filter(([, value, href]) => Boolean(value || href));
  const hours = contact.support_hours?.trim() || (locale === 'th' ? 'ให้บริการทุกวัน' : 'Available every day');
  const address = contact.address?.trim() || '';

  return (
    <PublicPageShell>
      <main style={{ ...pageStyle, background: branding.background_color, color: branding.text_color }}>
        <section style={{ ...cardStyle, background: branding.card_color }}>
          <Link href="/" style={{ ...backStyle, color: primaryColor }}>← {copy.back}</Link>
          <span style={{ ...eyebrowStyle, color: primaryColor }}>{copy.eyebrow}</span>
          <h1 style={titleStyle}>{copy.title}</h1>
          <p style={mutedStyle}>{siteName} · {hours}</p>
          {channels.length > 0 ? (
            <div style={gridStyle}>
              {channels.map(([label, value, href]) => <ContactCard key={label} label={label} value={value} href={href} primaryColor={primaryColor} openLabel={copy.open} />)}
            </div>
          ) : <p style={emptyStyle}>{copy.empty}</p>}
          {address && <div style={addressStyle}><strong>{copy.address}</strong><span>{address}</span></div>}
        </section>
      </main>
    </PublicPageShell>
  );
}

function ContactCard({ label, value, href, primaryColor, openLabel }: { label: string; value: string; href: string; primaryColor: string; openLabel: string }) {
  const normalized = label.toLowerCase();
  const finalHref = href || ((normalized === 'โทรศัพท์' || normalized === 'phone') ? `tel:${value}` : (normalized === 'อีเมล' || normalized === 'email') ? `mailto:${value}` : '');
  const content = <><span style={labelStyle}>{label}</span><strong>{value || openLabel}</strong></>;
  return finalHref ? <a href={finalHref} target={finalHref.startsWith('http') ? '_blank' : undefined} rel="noreferrer" style={{ ...itemStyle, borderColor: `${primaryColor}44`, color: 'inherit' }}>{content}</a> : <div style={itemStyle}>{content}</div>;
}

const pageStyle = { minHeight: '70dvh', padding: 16 } as const;
const cardStyle = { width: '100%', maxWidth: 820, margin: '0 auto', border: '1px solid rgba(255,255,255,.10)', borderRadius: 26, padding: 22, display: 'grid', gap: 14 } as const;
const backStyle = { textDecoration: 'none', fontWeight: 850 } as const;
const eyebrowStyle = { fontSize: 12, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' as const };
const titleStyle = { margin: 0, fontSize: 'clamp(30px, 8vw, 48px)', lineHeight: 1.05 } as const;
const mutedStyle = { margin: 0, color: '#94a3b8' } as const;
const emptyStyle = { margin: 0, padding: 16, borderRadius: 18, background: 'rgba(255,255,255,.04)', color: '#cbd5e1' } as const;
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px,100%),1fr))', gap: 10 } as const;
const itemStyle = { border: '1px solid rgba(255,255,255,.12)', borderRadius: 18, padding: 14, background: 'rgba(255,255,255,.04)', textDecoration: 'none', display: 'grid', gap: 5 } as const;
const labelStyle = { color: '#94a3b8', fontSize: 12, fontWeight: 850 } as const;
const addressStyle = { borderTop: '1px solid rgba(255,255,255,.10)', paddingTop: 14, display: 'grid', gap: 5, color: '#cbd5e1' } as const;
