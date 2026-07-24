'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';
import { checkLabel, humanStatus } from '../_components/human-labels';

type Provider = { id: string; name: string; code: string; status: string };
type RiskPanel = { provider?: Provider; status: string; flags: Record<string, boolean>; checks: Array<{ key: string; ok: boolean; label?: string }>; failedTransferCount: number; duplicateWebhookCount: number; unresolvedMismatchCount?: number; latestSnapshot?: { status: string; difference: string; checkedAt: string } | null };
type Preflight = { ok: boolean; blockers: string[]; unresolvedMismatchCount: number; riskStatus: string };
type PendingGate = { key: string; value: boolean; title: string; danger: boolean };
const gates = [
  { key: 'launchEnabled', title: 'ให้สมาชิกเข้าเกม', description: 'เปิดให้สมาชิกกดเล่นเกมจากค่ายนี้', safeDefault: true },
  { key: 'transferEnabled', title: 'ให้โยกเงินกับค่าย', description: 'อนุญาตส่งคำสั่งโยกเงินเข้าและออกเกมไปที่ค่าย', safeDefault: false },
  { key: 'walletSyncEnabled', title: 'เชื่อมวอลเล็ตกับเกม', description: 'เมื่อโยกเงิน ระบบจะหักหรือเพิ่มวอลเล็ตและลงประวัติเงินให้เอง', safeDefault: true },
  { key: 'webhookSettlementEnabled', title: 'ให้ Webhook มีผลกับเงิน', description: 'ใช้เฉพาะหลังทดสอบลายเซ็นและรายการซ้ำแล้ว', safeDefault: false },
  { key: 'realMoneyEnabled', title: 'เปิดเงินจริง', description: 'เปิดเฉพาะตอนพร้อมใช้งานจริงเท่านั้น', safeDefault: false, danger: true },
];

export default function ProviderRiskPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState('');
  const [panel, setPanel] = useState<RiskPanel | null>(null);
  const [preflight, setPreflight] = useState<Preflight | null>(null);
  const [pendingGate, setPendingGate] = useState<PendingGate | null>(null);
  const [message, setMessage] = useState('กำลังโหลดค่ายเกม...');
  const [loading, setLoading] = useState(false);
  useEffect(() => { void loadProviders(); }, []);

  async function loadProviders() {
    if (loading) return;
    setLoading(true); setMessage('กำลังโหลดค่ายเกม...');
    try {
      const res = await adminApiFetch('/admin/game-providers');
      const data = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(data?.items)) throw new Error('load');
      const items = data.items as Provider[];
      const first = items[0]?.id ?? '';
      setProviders(items); setProviderId(first); setMessage('');
      if (first) await fetchRisk(first);
    } catch {
      setProviders([]); setProviderId(''); setPanel(null); setPreflight(null); setMessage('โหลดค่ายเกมไม่สำเร็จ กรุณาลองใหม่');
    } finally { setLoading(false); }
  }

  async function fetchRisk(id: string) {
    const res = await adminApiFetch(`/admin/game-providers/${id}/risk-panel`);
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.flags || !Array.isArray(data?.checks)) throw new Error('risk');
    setPanel(data as RiskPanel); setPreflight(null);
  }

  async function loadRisk(id = providerId) {
    if (!id || loading) return;
    setLoading(true); setMessage('กำลังตรวจความพร้อม...');
    try { await fetchRisk(id); setMessage(''); }
    catch { setPanel(null); setPreflight(null); setMessage('ตรวจความพร้อมไม่สำเร็จ กรุณาลองใหม่'); }
    finally { setLoading(false); }
  }

  function requestGate(key: string, value: boolean, title: string, danger = false) {
    if (!providerId || loading) return;
    setPendingGate({ key, value, title, danger });
  }

  async function confirmGate() {
    if (!providerId || !pendingGate || loading) return;
    setLoading(true); setMessage('กำลังบันทึกการตั้งค่า...');
    try {
      const res = await adminApiFetch(`/admin/game-providers/${providerId}/gates`, { method: 'PATCH', body: JSON.stringify({ [pendingGate.key]: pendingGate.value }) });
      if (!res.ok) throw new Error('save');
      await fetchRisk(providerId);
      setPendingGate(null); setMessage('บันทึกการตั้งค่าแล้ว');
    } catch { setMessage('บันทึกการตั้งค่าไม่สำเร็จ กรุณาลองใหม่'); }
    finally { setLoading(false); }
  }

  async function runPreflight() {
    if (!providerId || loading) return;
    setLoading(true); setMessage('กำลังตรวจขั้นสุดท้าย...');
    try {
      const res = await adminApiFetch(`/admin/game-providers/${providerId}/preflight`);
      const data = await res.json().catch(() => null);
      if (!res.ok || typeof data?.ok !== 'boolean') throw new Error('preflight');
      setPreflight(data as Preflight);
      setMessage(data.ok ? 'ตรวจผ่าน พร้อมไปขั้นต่อไป' : 'ยังมีจุดที่ต้องแก้ก่อนเปิดเงินจริง');
    } catch { setPreflight(null); setMessage('ตรวจขั้นสุดท้ายไม่สำเร็จ กรุณาลองใหม่'); }
    finally { setLoading(false); }
  }

  const passed = panel?.checks.filter((item) => item.ok).length ?? 0;
  const total = panel?.checks.length ?? 0;
  const walletSyncReady = Boolean(panel?.flags?.transferEnabled && panel?.flags?.walletSyncEnabled);
  const readiness = useMemo(() => readinessState(panel, preflight), [panel, preflight]);
  const readinessScore = useMemo(() => readinessScoreFor(panel, preflight), [panel, preflight]);

  return <AdminPage eyebrow="ตั้งค่าค่ายเกม" title="ตรวจความพร้อมค่าย" description="ดูว่าค่ายพร้อมใช้งานไหม เปิดอะไรอยู่ และต้องแก้อะไรก่อนเปิดเงินจริง" actions={<><AdminButton onClick={() => void loadRisk()} disabled={loading || !providerId}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton><AdminButton tone="secondary" onClick={() => void runPreflight()} disabled={loading || !providerId}>ตรวจขั้นสุดท้าย</AdminButton></>}>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    <AdminCard title="เลือกค่าย" description="เลือกค่ายที่ต้องการตรวจ"><select value={providerId} disabled={loading} onChange={(event) => { setProviderId(event.target.value); void loadRisk(event.target.value); }} style={inputStyle}>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name} ({provider.code})</option>)}</select></AdminCard>
    {panel && <>
      <AdminCard title="สรุปสั้น ๆ" description="อ่านตรงนี้ก่อน"><div style={trafficStyle(readiness.tone)}><strong>{readiness.label}</strong><p>{readiness.description}</p></div><AdminStack>{readiness.nextActions.map((item) => <AdminRow key={item}><strong>{item}</strong><AdminBadge tone={readiness.tone}>{readiness.label}</AdminBadge></AdminRow>)}</AdminStack></AdminCard>
      <AdminMetricGrid><AdminMetric title="คะแนนความพร้อม" value={`${readinessScore}%`} helper={`${passed}/${total} รายการผ่าน`} tone={readinessScore >= 90 ? 'success' : readinessScore >= 60 ? 'warning' : 'danger'} /><AdminMetric title="สถานะรวม" value={humanStatus(panel.status)} helper="สถานะความพร้อม" /><AdminMetric title="วอลเล็ตกับเกม" value={walletSyncReady ? 'พร้อม' : 'ยังไม่พร้อม'} helper="โยกเงินและลงประวัติเงิน" /><AdminMetric title="ยอดไม่ตรง" value={String(panel.unresolvedMismatchCount ?? 0)} helper="ห้ามเปิดเงินจริงถ้ายังค้าง" /></AdminMetricGrid>
      <AdminCard title={panel.provider?.name ?? 'ค่ายเกม'} description="ควบคุมการเปิดใช้งาน"><AdminStack>{gates.map((gate) => { const value = Boolean(panel.flags[gate.key]); return <AdminRow key={gate.key}><div><strong>{gate.title}</strong><p style={mutedStyle}>{gate.description}</p></div><div style={gateStyle}><AdminBadge tone={gate.danger && value ? 'danger' : value ? 'success' : gate.safeDefault ? 'warning' : 'neutral'}>{value ? 'เปิด' : 'ปิด'}</AdminBadge><AdminButton tone={gate.danger && !value ? 'danger' : 'secondary'} onClick={() => requestGate(gate.key, !value, gate.title, Boolean(gate.danger))} disabled={loading}>{value ? 'ปิด' : 'เปิด'}</AdminButton></div></AdminRow>; })}</AdminStack>{panel.latestSnapshot && <AdminNotice>ตรวจยอดล่าสุด: {humanStatus(panel.latestSnapshot.status)} · ส่วนต่าง {panel.latestSnapshot.difference}</AdminNotice>}</AdminCard>
      {preflight && <AdminCard title="ผลตรวจขั้นสุดท้ายก่อนเงินจริง" description="ต้องผ่านก่อนเปิดเงินจริง"><AdminRow><strong>{preflight.ok ? 'พร้อม' : 'ยังไม่พร้อม'}</strong><AdminBadge tone={preflight.ok ? 'success' : 'danger'}>{preflight.ok ? 'ผ่าน' : 'ต้องแก้'}</AdminBadge></AdminRow>{preflight.blockers?.length > 0 && <AdminNotice>{preflight.blockers.join(', ')}</AdminNotice>}</AdminCard>}
      <AdminToolbar><strong>รายการตรวจ</strong><span style={mutedStyle}>{passed}/{total} เรียบร้อย</span></AdminToolbar><AdminStack>{panel.checks.map((item) => <AdminCard key={item.key}><AdminRow><strong>{checkLabel(item.key)}</strong><AdminBadge tone={item.ok ? 'success' : 'danger'}>{item.ok ? 'เรียบร้อย' : 'ต้องทำ'}</AdminBadge></AdminRow></AdminCard>)}</AdminStack>
    </>}
    {!loading && !panel && <AdminEmpty>ยังไม่มีข้อมูลค่าย</AdminEmpty>}
    <AdminConfirmDialog open={Boolean(pendingGate)} title={pendingGate ? `${pendingGate.value ? 'เปิด' : 'ปิด'} ${pendingGate.title}` : ''} description={pendingGate?.danger && pendingGate.value ? 'การเปิดเงินจริงมีผลต่อธุรกรรม โปรดตรวจขั้นสุดท้ายและยอดค้างก่อนยืนยัน' : 'ยืนยันการเปลี่ยนการตั้งค่าค่ายเกมนี้'} confirmLabel={pendingGate?.value ? 'ยืนยันเปิด' : 'ยืนยันปิด'} tone={pendingGate?.danger && pendingGate.value ? 'danger' : 'primary'} busy={loading} onCancel={() => { if (!loading) setPendingGate(null); }} onConfirm={() => void confirmGate()} />
  </AdminPage>;
}

function readinessState(panel: RiskPanel | null, preflight: Preflight | null): { label: 'พร้อมใช้' | 'พร้อมทดสอบ' | 'ต้องตรวจ' | 'มีปัญหา'; tone: 'success' | 'warning' | 'danger' | 'neutral'; description: string; nextActions: string[] } {
  if (!panel) return { label: 'มีปัญหา', tone: 'danger', description: 'ยังไม่มีข้อมูลค่าย', nextActions: ['เลือกค่ายก่อน'] };
  const failedChecks = panel.checks.filter((item) => !item.ok).map((item) => checkLabel(item.key));
  const mismatch = Number(panel.unresolvedMismatchCount ?? 0) > 0;
  const hasFailures = Number(panel.failedTransferCount ?? 0) > 0;
  if (preflight && !preflight.ok) return { label: 'มีปัญหา', tone: 'danger', description: 'ยังมีจุดที่ห้ามเปิดเงินจริง', nextActions: preflight.blockers?.length ? preflight.blockers : ['แก้จุดที่ตรวจไม่ผ่าน'] };
  if (failedChecks.length > 0) return { label: 'มีปัญหา', tone: 'danger', description: 'ยังมีรายการตรวจไม่ผ่าน', nextActions: failedChecks.slice(0, 4) };
  if (mismatch || hasFailures) return { label: 'ต้องตรวจ', tone: 'warning', description: 'ระบบพื้นฐานพร้อม แต่ยังมีรายการผิดปกติ', nextActions: ['ตรวจรายการโยกเงินมีปัญหา', 'ตรวจยอดค่ายไม่ตรง', 'ปิดการแจ้งเตือนที่แก้แล้ว'] };
  if (!panel.flags.realMoneyEnabled) return { label: 'พร้อมทดสอบ', tone: 'warning', description: 'พร้อมสำหรับทดสอบ แต่ยังไม่เปิดเงินจริง', nextActions: ['ทดสอบ API', 'ตรวจยอด', 'ตรวจขั้นสุดท้ายก่อนเปิดเงินจริง'] };
  return { label: 'พร้อมใช้', tone: 'success', description: 'ค่ายพร้อมตามการตั้งค่าปัจจุบัน', nextActions: ['ติดตามการโยกเงิน', 'ตรวจยอดเป็นระยะ'] };
}
function readinessScoreFor(panel: RiskPanel | null, preflight: Preflight | null) { if (!panel || panel.checks.length === 0) return 0; const passed = panel.checks.filter((item) => item.ok).length; let score = Math.round((passed / panel.checks.length) * 100); if ((panel.unresolvedMismatchCount ?? 0) > 0 || panel.failedTransferCount > 0) score = Math.min(score, 70); if (preflight && !preflight.ok) score = Math.min(score, 49); return score; }
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 15 };
const gateStyle = { display: 'flex', gap: 8, alignItems: 'center' as const, justifyContent: 'flex-end' as const, flexWrap: 'wrap' as const };
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
function trafficStyle(tone: 'success' | 'warning' | 'danger' | 'neutral') { const map = { success: 'rgba(34,197,94,.14)', warning: 'rgba(245,197,66,.14)', danger: 'rgba(239,68,68,.14)', neutral: 'rgba(148,163,184,.12)' }; return { border: '1px solid rgba(148,163,184,.18)', borderRadius: 18, padding: 16, background: map[tone], display: 'grid', gap: 6, marginBottom: 12 } as const; }