'use client';

import { useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminGrid, AdminLinkButton, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

type NoticeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
type PresetCode = 'demo-provider' | 'simulator-provider' | 'generic-transfer' | 'generic-seamless' | 'real-provider';
type FormState = { presetCode: PresetCode; name: string; code: string; baseUrl: string; apiKey: string; secretKey: string; merchantId: string; agentId: string; webhookSecret: string };

const steps = ['ค่าย', 'การเชื่อมต่อ', 'Credential', 'ตรวจและสร้าง'] as const;
const presetEndpoints: Record<PresetCode, string[]> = {
  'demo-provider': ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'WEBHOOK', 'HEALTH_CHECK'],
  'simulator-provider': ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'WEBHOOK', 'HEALTH_CHECK'],
  'generic-transfer': ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'GAME_LIST', 'WEBHOOK', 'HEALTH_CHECK'],
  'generic-seamless': ['LAUNCH', 'BALANCE', 'BET_HISTORY', 'WEBHOOK', 'HEALTH_CHECK'],
  'real-provider': ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'GAME_LIST', 'BET_HISTORY', 'WEBHOOK', 'HEALTH_CHECK'],
};
const presetCredentials: Record<PresetCode, Array<keyof Pick<FormState, 'apiKey' | 'secretKey' | 'merchantId' | 'agentId' | 'webhookSecret'>>> = {
  'demo-provider': ['apiKey', 'webhookSecret'], 'simulator-provider': ['apiKey', 'webhookSecret'], 'generic-transfer': ['apiKey', 'secretKey', 'merchantId', 'webhookSecret'], 'generic-seamless': ['apiKey', 'secretKey', 'agentId', 'webhookSecret'], 'real-provider': ['apiKey', 'secretKey', 'merchantId', 'agentId', 'webhookSecret'],
};

export default function ProviderSetupWizardPage() {
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<NoticeTone>('neutral');
  const [form, setForm] = useState<FormState>({ presetCode: 'generic-transfer', name: '', code: '', baseUrl: '', apiKey: '', secretKey: '', merchantId: '', agentId: '', webhookSecret: '' });
  const endpoints = presetEndpoints[form.presetCode];
  const credentials = presetCredentials[form.presetCode];
  const endpointPreview = useMemo(() => endpoints.map((type) => ({ type, url: `${form.baseUrl.replace(/\/+$/, '')}/${type.toLowerCase().replaceAll('_', '-')}` })), [endpoints, form.baseUrl]);
  const missingCredentials = credentials.filter((key) => !form[key].trim());
  const environment = providerEnvironment(form);
  const progress = `${active + 1}/${steps.length}`;
  function showMessage(next: string, tone: NoticeTone = 'neutral') { setMessage(next); setMessageTone(tone); }
  function update(key: keyof FormState, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  function validateStep(step: number) { if (step === 0 && (!form.name.trim() || !form.code.trim())) return 'กรอกชื่อและรหัสค่าย'; if (step === 1 && !isUrlLike(form.baseUrl)) return 'Base URL ต้องขึ้นต้นด้วย http:// หรือ https://'; if (step === 2 && missingCredentials.length > 0) return `กรอก ${missingCredentials.map(credentialLabelFromKey).join(', ')}`; if (step === 3 && !acknowledged) return 'ยืนยันว่าจะสร้างค่ายแบบปิดก่อน'; return ''; }
  function next() { const error = validateStep(active); if (error) { showMessage(error, 'warning'); return; } showMessage(''); setActive((value) => Math.min(value + 1, steps.length - 1)); }
  function previous() { showMessage(''); setActive((value) => Math.max(0, value - 1)); }
  function goTo(index: number) { if (index <= active) { setActive(index); return; } const error = validateStep(active); if (error) { showMessage(error, 'warning'); return; } setActive(active + 1); }
  async function submit() { const error = steps.map((_, index) => validateStep(index)).find(Boolean); if (error) { showMessage(error, 'danger'); return; } setSaving(true); showMessage('กำลังสร้างค่าย...'); const res = await adminApiFetch('/admin/provider-presets/apply', { method: 'POST', body: JSON.stringify({ ...form, status: 'INACTIVE', enabledEndpoints: endpoints, endpointOverrides: endpointPreview }) }); const data = await res.json().catch(() => null); setSaving(false); if (!res.ok || !data?.ok) { showMessage('สร้างค่ายไม่สำเร็จ', 'danger'); return; } showMessage(`สร้างค่ายแล้ว: ${data.provider?.name ?? form.name}`, 'success'); window.location.href = '/simple-game-settings'; }
  return <AdminPage eyebrow="ตั้งค่าค่ายเกม" title="เพิ่มค่ายใหม่" description="4 ขั้น สร้างแบบปิด และไม่เปิดเงินจริง">
    <AdminNotice tone="warning">ค่ายใหม่จะเป็น Inactive และ real-money gate ปิดเสมอ</AdminNotice>
    {message && <AdminNotice tone={messageTone}>{message}</AdminNotice>}
    <AdminGrid><AdminCard title={`ขั้น ${active + 1}: ${steps[active]}`} description={`ความคืบหน้า ${progress}`}><div style={stepNavStyle} role="navigation" aria-label="ขั้นตอนตั้งค่าค่าย">{steps.map((item, index) => <button key={item} type="button" onClick={() => goTo(index)} style={index === active ? activeStepStyle : stepStyle} aria-current={index === active ? 'step' : undefined}>{index + 1}</button>)}</div>
      {active === 0 && <section style={panelStyle}><label style={labelStyle}>Preset<select value={form.presetCode} onChange={(event) => { update('presetCode', event.target.value as PresetCode); setAcknowledged(false); }} style={inputStyle}>{(Object.keys(presetEndpoints) as PresetCode[]).map((item) => <option key={item} value={item}>{presetLabel(item)}</option>)}</select></label><label style={labelStyle}>ชื่อค่าย<input value={form.name} onChange={(event) => update('name', event.target.value)} style={inputStyle} /></label><label style={labelStyle}>รหัสค่าย<input value={form.code} onChange={(event) => { update('code', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); setAcknowledged(false); }} style={inputStyle} placeholder="pgsoft-uat" /></label><AdminRow><span>สภาพแวดล้อม</span><AdminBadge tone={environment === 'PRODUCTION' ? 'danger' : environment === 'UAT' ? 'warning' : 'success'}>{environment}</AdminBadge></AdminRow></section>}
      {active === 1 && <section style={panelStyle}><label style={labelStyle}>Base URL<input value={form.baseUrl} onChange={(event) => update('baseUrl', event.target.value)} style={inputStyle} placeholder="https://provider.example.test/api" /></label><AdminStack>{endpointPreview.map((item) => <AdminRow key={item.type}><strong>{endpointLabel(item.type)}</strong><span style={monoStyle}>{item.url}</span></AdminRow>)}</AdminStack></section>}
      {active === 2 && <section style={panelStyle}>{credentials.map((key) => <label key={key} style={labelStyle}>{credentialLabelFromKey(key)}<input type="password" value={form[key]} onChange={(event) => update(key, event.target.value)} style={inputStyle} autoComplete="off" /></label>)}<AdminNotice tone="warning">เก็บเฉพาะค่าที่กรอกจริง และจะแสดงกลับแบบปิดบัง</AdminNotice></section>}
      {active === 3 && <section style={panelStyle}><AdminRow><span>Preset</span><AdminBadge tone="success">{presetLabel(form.presetCode)}</AdminBadge></AdminRow><AdminRow><span>ค่าย</span><strong>{form.name || '-'} / {form.code || '-'}</strong></AdminRow><AdminRow><span>Endpoint</span><strong>{endpoints.length} รายการ</strong></AdminRow><AdminRow><span>Credential</span><strong>{credentials.length - missingCredentials.length}/{credentials.length}</strong></AdminRow><AdminRow><span>Real money</span><AdminBadge tone="success">ปิดอยู่</AdminBadge></AdminRow>{environment === 'PRODUCTION' && <AdminNotice tone="danger">ค่านี้เป็น Production แต่ยังสร้างแบบปิด ต้องผ่าน Preflight ก่อนเปิดเงินจริง</AdminNotice>}<label style={checkStyle}><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /> ยืนยันว่าจะสร้างแบบ Inactive และไม่เปิดเงินจริง</label></section>}
      <div style={actionRowStyle}><AdminButton tone="secondary" onClick={previous} disabled={active === 0 || saving}>ย้อนกลับ</AdminButton>{active < steps.length - 1 ? <AdminButton onClick={next} disabled={saving}>ถัดไป</AdminButton> : <AdminButton onClick={submit} disabled={saving || !acknowledged}>{saving ? 'กำลังสร้าง...' : 'สร้างค่าย'}</AdminButton>}<AdminLinkButton href="/provider-presets">ดู Preset</AdminLinkButton></div>
    </AdminCard><AdminCard title="ก่อนเปิดจริง" description="ทำต่อหลังสร้างค่าย"><AdminStack>{[['1', 'ทดสอบ API', 'ใช้ Safe Test หรือ UAT'], ['2', 'ตรวจยอด', 'ต้องไม่มียอดค้าง'], ['3', 'Preflight', 'แก้ blocker ให้ครบ'], ['4', 'เปิดเงินจริง', 'ทำจาก Provider Risk']].map(([step, title, description]) => <AdminRow key={step}><div><strong>{step}. {title}</strong><p style={mutedStyle}>{description}</p></div><AdminBadge tone={step === '4' ? 'danger' : 'warning'}>{step === '4' ? 'Gate' : 'Required'}</AdminBadge></AdminRow>)}</AdminStack></AdminCard></AdminGrid>
  </AdminPage>;
}

function providerEnvironment(form: FormState) { const code = form.code.trim().toLowerCase(); if (code.endsWith('-uat')) return 'UAT'; if (form.presetCode === 'demo-provider' || form.presetCode === 'simulator-provider') return 'DEMO'; return 'PRODUCTION'; }
function presetLabel(value: PresetCode) { const labels: Record<PresetCode, string> = { 'demo-provider': 'Demo', 'simulator-provider': 'Simulator', 'generic-transfer': 'Transfer', 'generic-seamless': 'Seamless', 'real-provider': 'Real provider' }; return labels[value]; }
function endpointLabel(value: string) { const labels: Record<string, string> = { LAUNCH: 'เปิดเกม', BALANCE: 'ตรวจยอด', TRANSFER_IN: 'โยกเข้าเกม', TRANSFER_OUT: 'โยกกลับวอเลต', GAME_LIST: 'รายการเกม', BET_HISTORY: 'ประวัติเกม', WEBHOOK: 'Webhook', HEALTH_CHECK: 'Health check' }; return labels[value] ?? value; }
function credentialLabelFromKey(value: keyof FormState) { const labels: Partial<Record<keyof FormState, string>> = { apiKey: 'API Key', secretKey: 'Secret Key', merchantId: 'Merchant ID', agentId: 'Agent ID', webhookSecret: 'Webhook Secret' }; return labels[value] ?? value; }
function isUrlLike(value: string) { return /^https?:\/\//.test(value.trim()); }

const panelStyle = { display: 'grid', gap: 12, marginTop: 14 } as const;
const labelStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 900 } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginTop: 12 };
const stepNavStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginTop: 12 };
const stepStyle = { width: 42, height: 42, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#cbd5e1', fontWeight: 950 } as const;
const activeStepStyle = { ...stepStyle, background: '#f5c542', color: '#111827', borderColor: '#f5c542' } as const;
const monoStyle = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', overflowWrap: 'anywhere' as const, color: '#cbd5e1', fontSize: 12 } as const;
const checkStyle = { display: 'flex', gap: 8, alignItems: 'center', color: '#cbd5e1', fontWeight: 800 } as const;
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
