'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

type Provider = { id: string; name: string; code: string; status: string };
type Credential = { id: string; type: string; maskedValue: string; isEnabled: boolean; rotatedAt?: string | null; createdAt: string; updatedAt: string };

export default function ProviderCredentialsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState('');
  const [items, setItems] = useState<Credential[]>([]);
  const [message, setMessage] = useState('กำลังโหลด API Key...');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  useEffect(() => { loadProviders(); }, []);
  useEffect(() => { if (providerId) loadCredentials(providerId); }, [providerId]);
  async function loadProviders() { const res = await adminApiFetch('/admin/game-providers'); const data = await res.json().catch(() => null); if (!res.ok) { setMessage(data?.message ?? 'โหลดค่ายไม่สำเร็จ'); return; } const rows = data.items ?? []; setProviders(rows); setProviderId(rows[0]?.id ?? ''); setMessage(''); }
  async function loadCredentials(id = providerId) { setLoading(true); const res = await adminApiFetch(`/admin/game-providers/${id}/credentials`); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'โหลด API Key ไม่สำเร็จ'); return; } setItems(data.items ?? []); setMessage(''); }
  async function rotate(item: Credential) { const value = window.prompt(`ค่าใหม่สำหรับ ${credentialLabel(item.type)}`); if (!value) return; if (!window.confirm(`เปลี่ยน ${credentialLabel(item.type)} ใช่ไหม? ค่าเก่าจะถูกแทนที่`)) return; setLoading(true); const res = await adminApiFetch(`/admin/game-providers/${providerId}/credentials/${item.id}`, { method: 'PATCH', body: JSON.stringify({ value, isEnabled: true }) }); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'เปลี่ยนค่าไม่สำเร็จ'); return; } setMessage(`เปลี่ยน ${credentialLabel(item.type)} แล้ว`); await loadCredentials(); }
  async function toggle(item: Credential) { if (item.isEnabled && !window.confirm(`ปิด ${credentialLabel(item.type)} ใช่ไหม? ถ้าค่ายต้องใช้ค่านี้ API อาจใช้งานไม่ได้`)) return; setLoading(true); const res = await adminApiFetch(`/admin/game-providers/${providerId}/credentials/${item.id}`, { method: 'PATCH', body: JSON.stringify({ isEnabled: !item.isEnabled }) }); const data = await res.json().catch(() => null); setLoading(false); if (!res.ok) { setMessage(data?.message ?? 'บันทึกไม่สำเร็จ'); return; } setMessage(`${!item.isEnabled ? 'เปิดใช้' : 'ปิด'} ${credentialLabel(item.type)} แล้ว`); await loadCredentials(); }
  async function testProvider() { setLoading(true); setMessage('กำลังทดสอบ API ค่าย...'); const res = await adminApiFetch(`/admin/game-providers/${providerId}/health-check`, { method: 'POST' }); const data = await res.json().catch(() => null); setLoading(false); setTestResult(data); setMessage(res.ok ? 'ทดสอบ API แล้ว' : data?.message ?? 'ทดสอบ API ไม่สำเร็จ'); }
  const enabled = items.filter((item) => item.isEnabled).length;
  const placeholders = items.filter(isPlaceholder).length;
  const stale = items.filter((item) => item.rotatedAt && Date.now() - new Date(item.rotatedAt).getTime() > 90 * 24 * 60 * 60 * 1000).length;
  return <AdminPage eyebrow="ตั้งค่าค่ายเกม" title="API Key / Secret" description="ใส่หรือเปลี่ยนค่าที่ค่ายให้มา โดยไม่แสดงค่าจริงกลับบนหน้าเว็บ" actions={<><AdminButton onClick={testProvider} disabled={loading || !providerId}>ทดสอบ API</AdminButton><AdminLinkButton href="/simple-game-settings">กลับตั้งค่าง่าย</AdminLinkButton></>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric title="ทั้งหมด" value={String(items.length)} helper="ค่าที่บันทึกไว้" /><AdminMetric title="เปิดใช้" value={String(enabled)} helper="ระบบนำไปใช้ได้" /><AdminMetric title="ปิดอยู่" value={String(items.length - enabled)} helper="ระบบไม่ใช้" /><AdminMetric title="ยังเป็นตัวอย่าง" value={String(placeholders)} helper="ควรเปลี่ยน" /><AdminMetric title="นานเกิน 90 วัน" value={String(stale)} helper="ควรตรวจ" /></AdminMetricGrid>
    <AdminCard title="เลือกค่าย"><select value={providerId} onChange={(event) => setProviderId(event.target.value)} style={inputStyle}>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} ({provider.code})</option>)}</select></AdminCard>
    {placeholders > 0 && <AdminNotice>ยังมีค่าตัวอย่างอยู่ ต้องเปลี่ยนก่อนใช้กับค่ายจริง ไม่งั้น API จะตอบกลับมาว่า “ไม่รู้จักคุณ” ในภาษาคอมพิวเตอร์</AdminNotice>}
    {stale > 0 && <AdminNotice>มีค่าที่ไม่ได้เปลี่ยนเกิน 90 วันแล้ว ควรตรวจรอบเปลี่ยนคีย์เพื่อความปลอดภัย</AdminNotice>}
    <AdminStack>{items.map((item) => <AdminCard key={item.id} title={credentialLabel(item.type)} description={`เปลี่ยนล่าสุด: ${item.rotatedAt ? new Date(item.rotatedAt).toLocaleString('th-TH') : '-'}`}><AdminRow><div><strong>{item.maskedValue}</strong><p style={mutedStyle}>อัปเดต {new Date(item.updatedAt).toLocaleString('th-TH')}</p></div><div style={actionRowStyle}><AdminBadge tone={item.isEnabled ? 'success' : 'danger'}>{item.isEnabled ? 'เปิดใช้' : 'ปิดอยู่'}</AdminBadge>{isPlaceholder(item) && <AdminBadge tone="warning">ตัวอย่าง</AdminBadge>}</div></AdminRow><div style={actionRowStyle}><AdminButton onClick={() => rotate(item)} disabled={loading}>เปลี่ยนค่า</AdminButton><AdminButton tone="secondary" onClick={() => toggle(item)} disabled={loading}>{item.isEnabled ? 'ปิด' : 'เปิดใช้'}</AdminButton></div></AdminCard>)}{!loading && items.length === 0 && <AdminEmpty>ยังไม่มี API Key / Secret</AdminEmpty>}</AdminStack>
    {testResult && <AdminCard title="ผลทดสอบ API" description="แสดงเฉพาะผลลัพธ์ที่ระบบซ่อนไม่ให้เห็น secret แล้ว"><pre style={preStyle}>{JSON.stringify(testResult, null, 2)}</pre></AdminCard>}
  </AdminPage>;
}
function credentialLabel(type: string) { const map: Record<string, string> = { API_KEY: 'API Key', SECRET_KEY: 'Secret Key', MERCHANT_ID: 'Merchant ID', AGENT_ID: 'Agent ID', WEBHOOK_SECRET: 'Webhook Secret', TOKEN: 'Token' }; return map[type] ?? type; }
function isPlaceholder(item: Credential) { return item.maskedValue?.includes('TODO') || item.maskedValue?.includes('placeholder'); }
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const actionRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'center' as const };
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const preStyle = { overflowX: 'auto' as const, whiteSpace: 'pre-wrap' as const, background: '#020617', borderRadius: 12, padding: 12, color: '#cbd5e1', maxHeight: 520 } as const;
