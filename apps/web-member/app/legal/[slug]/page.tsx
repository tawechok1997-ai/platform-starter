'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { defaultSettings, loadPublicSiteSettings, PublicSiteSettings, textSetting } from '../../site-settings';

type LegalItem = { key: string; title: string };

const DEFAULT_LEGAL_ITEM: LegalItem = {
  key: 'terms',
  title: 'เงื่อนไขการใช้งาน',
};

const legalMap: Record<string, LegalItem> = {
  terms: DEFAULT_LEGAL_ITEM,
  privacy: { key: 'privacy', title: 'นโยบายความเป็นส่วนตัว' },
  cookie: { key: 'cookie', title: 'นโยบายคุกกี้' },
  'responsible-use': { key: 'responsible_use', title: 'การใช้งานอย่างรับผิดชอบ' },
  'about-us': { key: 'about_us', title: 'เกี่ยวกับเรา' },
  contact: { key: 'contact_policy', title: 'นโยบายการติดต่อ' },
};

export default function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadPublicSiteSettings().then(setSettings).finally(() => setReady(true));
  }, []);

  const item = legalMap[slug] ?? DEFAULT_LEGAL_ITEM;
  const siteName = textSetting(settings, 'website', 'site_name', 'Platform Starter');
  const primaryColor = textSetting(settings, 'branding', 'primary_color', '#f5c542');
  const backgroundColor = textSetting(settings, 'branding', 'background_color', '#080808');
  const cardColor = textSetting(settings, 'branding', 'card_color', '#181818');
  const textColor = textSetting(settings, 'branding', 'text_color', '#ffffff');
  const content = textSetting(settings, 'legal', item.key, 'ยังไม่มีเนื้อหาสำหรับหน้านี้');

  return (
    <main style={{ ...pageStyle, background: backgroundColor, color: textColor }}>
      <section style={{ ...cardStyle, background: cardColor }}>
        <Link href="/" style={{ ...backStyle, color: primaryColor }}>← {siteName}</Link>
        <span style={{ ...eyebrowStyle, color: primaryColor }}>Legal</span>
        <h1 style={titleStyle}>{item.title}</h1>
        <div style={contentStyle}>{ready ? content : 'กำลังโหลด...'}</div>
      </section>
    </main>
  );
}

const pageStyle = { minHeight: '100dvh', padding: 16 } as const;
const cardStyle = { width: '100%', maxWidth: 820, margin: '0 auto', border: '1px solid rgba(255,255,255,.10)', borderRadius: 26, padding: 22, display: 'grid', gap: 12 } as const;
const backStyle = { textDecoration: 'none', fontWeight: 850 } as const;
const eyebrowStyle = { fontSize: 12, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' as const };
const titleStyle = { margin: 0, fontSize: 'clamp(30px, 8vw, 48px)', lineHeight: 1.05 } as const;
const contentStyle = { whiteSpace: 'pre-wrap' as const, lineHeight: 1.75, color: '#cbd5e1' };
