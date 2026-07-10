'use client';

import { useEffect, useState } from 'react';
import { defaultSettings, loadPublicSiteSettings, PublicSiteSettings, textSetting } from '../site-settings';

export default function ContactPage() {
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  useEffect(() => { loadPublicSiteSettings().then(setSettings).catch(() => setSettings(defaultSettings)); }, []);
  const siteName = textSetting(settings, 'website', 'site_name', 'Platform Starter');
  const primaryColor = textSetting(settings, 'branding', 'primary_color', '#f5c542');
  const backgroundColor = textSetting(settings, 'branding', 'background_color', '#080808');
  const cardColor = textSetting(settings, 'branding', 'card_color', '#181818');
  const textColor = textSetting(settings, 'branding', 'text_color', '#ffffff');
  const channels = [
    ['LINE', textSetting(settings, 'contact', 'line_oa', ''), textSetting(settings, 'contact', 'line_url', '')],
    ['Telegram', textSetting(settings, 'contact', 'telegram', ''), textSetting(settings, 'contact', 'telegram_url', '')],
    ['Facebook', textSetting(settings, 'contact', 'facebook', ''), textSetting(settings, 'contact', 'facebook_url', '')],
    ['Live Chat', 'ติดต่อทีมช่วยเหลือ', textSetting(settings, 'contact', 'live_chat_url', '')],
    ['โทรศัพท์', textSetting(settings, 'contact', 'phone', ''), ''],
    ['อีเมล', textSetting(settings, 'contact', 'email', ''), ''],
  ].filter(([, value, href]) => value || href);
  const hours = textSetting(settings, 'contact', 'support_hours', 'ให้บริการทุกวัน');
  const address = textSetting(settings, 'contact', 'address', '');
  return <main style={{ ...pageStyle, background: backgroundColor, color: textColor }}><section style={{ ...cardStyle, background: cardColor }}><a href="/" style={{ ...backStyle, color: primaryColor }}>← {siteName}</a><span style={{ ...eyebrowStyle, color: primaryColor }}>Contact</span><h1 style={titleStyle}>ติดต่อเรา</h1><p style={mutedStyle}>{hours}</p><div style={gridStyle}>{channels.map(([label, value, href]) => <ContactCard key={label} label={label} value={value} href={href} primaryColor={primaryColor} />)}</div>{address && <div style={addressStyle}><strong>ที่อยู่</strong><span>{address}</span></div>}</section></main>;
}

function ContactCard({ label, value, href, primaryColor }: { label: string; value: string; href: string; primaryColor: string }) {
  const finalHref = href || (label === 'โทรศัพท์' ? `tel:${value}` : label === 'อีเมล' ? `mailto:${value}` : '');
  const content = <><span style={labelStyle}>{label}</span><strong>{value || 'เปิดช่องทางติดต่อ'}</strong></>;
  return finalHref ? <a href={finalHref} target={finalHref.startsWith('http') ? '_blank' : undefined} rel="noreferrer" style={{ ...itemStyle, borderColor: `${primaryColor}44`, color: 'inherit' }}>{content}</a> : <div style={itemStyle}>{content}</div>;
}

const pageStyle = { minHeight: '100dvh', padding: 16 } as const;
const cardStyle = { width: '100%', maxWidth: 820, margin: '0 auto', border: '1px solid rgba(255,255,255,.10)', borderRadius: 26, padding: 22, display: 'grid', gap: 14 } as const;
const backStyle = { textDecoration: 'none', fontWeight: 850 } as const;
const eyebrowStyle = { fontSize: 12, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' as const };
const titleStyle = { margin: 0, fontSize: 'clamp(30px, 8vw, 48px)', lineHeight: 1.05 } as const;
const mutedStyle = { margin: 0, color: '#94a3b8' } as const;
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px,100%),1fr))', gap: 10 } as const;
const itemStyle = { border: '1px solid rgba(255,255,255,.12)', borderRadius: 18, padding: 14, background: 'rgba(255,255,255,.04)', textDecoration: 'none', display: 'grid', gap: 5 } as const;
const labelStyle = { color: '#94a3b8', fontSize: 12, fontWeight: 850 } as const;
const addressStyle = { borderTop: '1px solid rgba(255,255,255,.10)', paddingTop: 14, display: 'grid', gap: 5, color: '#cbd5e1' } as const;
