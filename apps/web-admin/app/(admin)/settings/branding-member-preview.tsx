'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { AdminButton, AdminStack } from '../_components/admin-ui';

type SettingsValue = string | boolean | number | null;
type SettingsRecord = Record<string, SettingsValue>;
type PreviewViewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_WIDTHS: Record<PreviewViewport, number> = {
  desktop: 1180,
  tablet: 768,
  mobile: 390,
};

export default function BrandingMemberPreview({ form }: { form: SettingsRecord }) {
  const [viewport, setViewport] = useState<PreviewViewport>('desktop');
  const palette = useMemo(() => ({
    primary: stringValue(form.primary_color, '#f5c542'),
    background: stringValue(form.background_color, '#080808'),
    card: stringValue(form.card_color, '#181818'),
    text: stringValue(form.text_color, '#ffffff'),
    muted: stringValue(form.muted_text_color, '#a1a1aa'),
    border: stringValue(form.border_color, 'rgba(255,255,255,.12)'),
  }), [form]);
  const logo = firstImage(form.logo_horizontal_url, form.logo_url, form.logo_mobile_url);
  const width = VIEWPORT_WIDTHS[viewport];
  const isMobile = viewport === 'mobile';

  return (
    <AdminStack>
      <div role="group" aria-label="Preview viewport" style={viewportToolbarStyle}>
        {(['desktop', 'tablet', 'mobile'] as const).map((item) => (
          <AdminButton key={item} type="button" tone={viewport === item ? 'primary' : 'secondary'} onClick={() => setViewport(item)}>
            {item === 'desktop' ? 'Desktop' : item === 'tablet' ? 'Tablet' : 'Mobile'}
          </AdminButton>
        ))}
      </div>
      <div style={stageStyle}>
        <div data-preview-viewport={viewport} style={{ ...deviceStyle, width, maxWidth: '100%', background: palette.background, color: palette.text, borderColor: palette.border }}>
          <header style={{ ...headerStyle, borderColor: palette.border }}>
            <div style={logoWrapStyle}>
              {logo ? <Image unoptimized src={logo} alt="Member preview logo" width={220} height={72} style={logoStyle} /> : <strong>Brand</strong>}
            </div>
            {!isMobile && <nav style={navStyle}><span>หน้าแรก</span><span>คาสิโน</span><span>สล็อต</span><span>โปรโมชั่น</span></nav>}
            <button type="button" style={{ ...primaryButtonStyle, background: palette.primary, color: readableTextColor(palette.primary) }}>ฝากเงิน</button>
          </header>
          <main style={mainStyle}>
            <section style={{ ...heroStyle, background: `linear-gradient(135deg, ${palette.card}, ${palette.background})`, borderColor: palette.border }}>
              <div>
                <small style={{ color: palette.muted }}>MEMBER EXPERIENCE</small>
                <h2 style={heroTitleStyle}>เล่นง่าย จัดการบัญชีได้ในที่เดียว</h2>
                <p style={{ color: palette.muted, margin: 0 }}>ตัวอย่างหน้า Member จากค่าที่กำลังแก้ไขใน Admin</p>
              </div>
              <div style={balanceStyle}><small style={{ color: palette.muted }}>ยอดคงเหลือ</small><strong style={balanceValueStyle}>฿128,450.00</strong></div>
            </section>
            <section style={{ ...categoryGridStyle, gridTemplateColumns: `repeat(${isMobile ? 4 : 8}, minmax(0, 1fr))` }}>
              {['หน้าแรก', 'คาสิโน', 'สล็อต', 'สด', 'กีฬา', 'ตกปลา', 'หวย', 'ไพ่'].map((label) => <div key={label} style={{ ...categoryItemStyle, background: palette.card, borderColor: palette.border }}><span style={{ ...categoryIconStyle, background: `${palette.primary}22`, color: palette.primary }}>{label.slice(0, 1)}</span><small>{label}</small></div>)}
            </section>
            <section style={{ ...contentGridStyle, gridTemplateColumns: isMobile ? '1fr' : '1.35fr .65fr' }}>
              <article style={{ ...panelStyle, background: palette.card, borderColor: palette.border }}><small style={{ color: palette.muted }}>โปรโมชั่นแนะนำ</small><h3>รับโบนัสและสิทธิพิเศษล่าสุด</h3><div style={{ ...promoVisualStyle, background: `linear-gradient(120deg, ${palette.primary}44, transparent)` }} /></article>
              <article style={{ ...panelStyle, background: palette.card, borderColor: palette.border }}><small style={{ color: palette.muted }}>ทางลัด</small><div style={quickActionsStyle}><button style={{ ...actionButtonStyle, background: palette.primary, color: readableTextColor(palette.primary) }}>ฝากเงิน</button><button style={{ ...actionButtonStyle, background: 'transparent', color: palette.text, borderColor: palette.border }}>ถอนเงิน</button><button style={{ ...actionButtonStyle, background: 'transparent', color: palette.text, borderColor: palette.border }}>ช่วยเหลือ</button></div></article>
            </section>
          </main>
          {isMobile && <footer style={{ ...mobileNavStyle, background: palette.card, borderColor: palette.border }}><span>หน้าแรก</span><span>เกม</span><span>ฝาก</span><span>บัญชี</span></footer>}
        </div>
      </div>
      <small style={{ opacity: 0.72 }}>Preview นี้ใช้ค่าที่ยังไม่ได้บันทึก และย่อขนาดตามพื้นที่ Admin โดยรักษาสัดส่วน Desktop 1180px, Tablet 768px และ Mobile 390px</small>
    </AdminStack>
  );
}

function stringValue(value: SettingsValue | undefined, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function firstImage(...values: Array<SettingsValue | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && isImageUrl(value.trim())) return value.trim();
  }
  return '';
}

function isImageUrl(value: string) {
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function readableTextColor(background: string) {
  const match = /^#?([0-9a-f]{6})$/i.exec(background.trim());
  if (!match) return '#111111';
  const value = match[1];
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 >= 150 ? '#111111' : '#ffffff';
}

const viewportToolbarStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 8 } as const;
const stageStyle = { width: '100%', overflowX: 'auto' as const, padding: 12, borderRadius: 16, background: 'rgba(2,6,23,.45)' } as const;
const deviceStyle = { position: 'relative' as const, margin: '0 auto', minHeight: 620, border: '1px solid', borderRadius: 20, overflow: 'hidden' as const, transition: 'width .2s ease' } as const;
const headerStyle = { display: 'flex', alignItems: 'center', gap: 18, minHeight: 72, padding: '12px 18px', borderBottom: '1px solid' } as const;
const logoWrapStyle = { display: 'flex', alignItems: 'center', minWidth: 120, flex: '0 1 220px' } as const;
const logoStyle = { display: 'block', width: 'auto', maxWidth: '100%', height: 46, objectFit: 'contain' as const } as const;
const navStyle = { display: 'flex', alignItems: 'center', gap: 14, flex: 1, fontSize: 13, whiteSpace: 'nowrap' as const } as const;
const primaryButtonStyle = { minHeight: 40, border: 0, borderRadius: 10, padding: '0 16px', fontWeight: 800 } as const;
const mainStyle = { display: 'grid', gap: 16, padding: 18 } as const;
const heroStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, padding: 22, border: '1px solid', borderRadius: 18 } as const;
const heroTitleStyle = { margin: '6px 0 8px', fontSize: 'clamp(20px, 3vw, 34px)', lineHeight: 1.15 } as const;
const balanceStyle = { display: 'grid', gap: 4, minWidth: 160, textAlign: 'right' as const } as const;
const balanceValueStyle = { fontSize: 24, fontVariantNumeric: 'tabular-nums' as const } as const;
const categoryGridStyle = { display: 'grid', gap: 8 } as const;
const categoryItemStyle = { display: 'grid', justifyItems: 'center', gap: 6, minWidth: 0, padding: '10px 4px', border: '1px solid', borderRadius: 12 } as const;
const categoryIconStyle = { display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, fontWeight: 900 } as const;
const contentGridStyle = { display: 'grid', gap: 16 } as const;
const panelStyle = { minHeight: 190, padding: 18, border: '1px solid', borderRadius: 18 } as const;
const promoVisualStyle = { height: 86, marginTop: 18, borderRadius: 14 } as const;
const quickActionsStyle = { display: 'grid', gap: 10, marginTop: 18 } as const;
const actionButtonStyle = { minHeight: 42, border: '1px solid transparent', borderRadius: 10, fontWeight: 800 } as const;
const mobileNavStyle = { position: 'absolute' as const, left: 0, right: 0, bottom: 0, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, padding: 12, borderTop: '1px solid', textAlign: 'center' as const, fontSize: 12 } as const;
