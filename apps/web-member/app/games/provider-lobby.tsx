'use client';

import { useMemo, useState } from 'react';

type Provider = { code: string; name: string; logoUrl?: string | null };
type Props = { providers: Provider[]; selected: string; loading: boolean; onSelect: (code: string) => void };

export default function ProviderLobby({ providers, selected, loading, onSelect }: Props) {
  const activeProvider = useMemo(() => providers.find((item) => item.code === selected) ?? null, [providers, selected]);
  if (loading) return <section className="provider-lobby" aria-busy="true"><header><h2>ค่ายเกม</h2><span>กำลังโหลด...</span></header><div className="provider-lobby-grid">{Array.from({ length: 6 }, (_, index) => <div key={index} className="provider-lobby-card is-skeleton" />)}</div></section>;
  return <section className="provider-lobby" aria-label="Lobby ค่ายเกม">
    {activeProvider && <ProviderTheme provider={activeProvider} onClear={() => onSelect('all')} />}
    <header><h2>{activeProvider ? `ค่าย ${activeProvider.name}` : 'เลือกค่ายเกม'}</h2><span>{providers.length} ค่าย</span></header>
    <div className="provider-lobby-grid">{providers.slice(0, 12).map((provider, index) => <ProviderCard key={provider.code} provider={provider} index={index} active={selected === provider.code} onSelect={onSelect} />)}</div>
  </section>;
}

function ProviderTheme({ provider, onClear }: { provider: Provider; onClear: () => void }) {
  const [failed, setFailed] = useState(false);
  return <article className="provider-theme" style={{ '--provider-seed': String(colorSeed(provider.code)) } as React.CSSProperties}>
    <div className="provider-theme-logo">{provider.logoUrl && !failed ? <img src={provider.logoUrl} alt="" onError={() => setFailed(true)} /> : initials(provider.name)}</div>
    <div><span>PROVIDER LOBBY</span><h2>{provider.name}</h2><p>กำลังแสดงเกมทั้งหมดจากค่ายนี้ พร้อมตัวกรอง หมวด และแพลตฟอร์มที่ใช้งานร่วมกัน</p></div>
    <button type="button" onClick={onClear}>ดูทุกค่าย</button>
  </article>;
}

function ProviderCard({ provider, index, active, onSelect }: { provider: Provider; index: number; active: boolean; onSelect: (code: string) => void }) {
  const [failed, setFailed] = useState(false);
  return <button type="button" className={`provider-lobby-card${active ? ' is-active' : ''}`} aria-pressed={active} onClick={() => onSelect(provider.code)}><span className="provider-lobby-rank">#{String(index + 1).padStart(2, '0')}</span><span className="provider-lobby-logo">{provider.logoUrl && !failed ? <img src={provider.logoUrl} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} /> : initials(provider.name)}</span><strong title={provider.name}>{provider.name}</strong><small>{active ? 'กำลังแสดงค่ายนี้' : 'เปิด Lobby ค่าย'}</small></button>;
}
function initials(value: string) { const words = value.match(/[A-Za-z0-9ก-๙]+/g) ?? []; return (words.slice(0, 2).map((word) => word[0]).join('') || 'GP').toUpperCase(); }
function colorSeed(value: string) { let hash = 0; for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) % 360; return hash; }
