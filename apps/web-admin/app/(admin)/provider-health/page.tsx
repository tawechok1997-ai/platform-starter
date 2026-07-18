'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminStack } from '../_components/admin-ui';

type Provider = { id: string; name: string; code: string; status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DEGRADED'; walletMode: string; updatedAt: string; _count?: { endpoints?: number; credentials?: number; games?: number; sessions?: number; transfers?: number; webhookLogs?: number } };
type HealthResult = { ok: boolean; payload?: { status?: 'ONLINE' | 'OFFLINE' | 'DEGRADED'; latencyMs?: number }; readiness?: { ready?: boolean; passed?: number; total?: number }; checkedAt?: string };

export default function ProviderHealthPage() {
  const [items, setItems] = useState<Provider[]>([]);
  const [health, setHealth] = useState<Record<string, HealthResult>>({});
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    setMessage('');
    const res = await adminApiFetch('/admin/game-providers');
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'โหลด Provider ไม่สำเร็จ'); return; }
    setItems(data?.items ?? []);
  }

  async function check(provider: Provider) {
    setCheckingId(provider.id);
    const started = performance.now();
    const res = await adminApiFetch(`/admin/game-providers/${provider.id}/health-check`, { method: 'POST' });
    const data = await res.json().catch(() => null);
    const measuredLatency = Math.max(0, Math.round(performance.now() - started));
    setCheckingId('');
    if (!res.ok) {
      setHealth((current) => ({ ...current, [provider.id]: { ok: false, payload: { status: 'OFFLINE', latencyMs: measuredLatency }, checkedAt: new Date().toISOString() } }));
      return;
    }
    setHealth((current) => ({ ...current, [provider.id]: { ...data, payload: { ...data?.payload, latencyMs: Number(data?.payload?.latencyMs ?? measuredLatency) } } }));
  }

  const metrics = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => item.status === 'ACTIVE').length,
    degraded: items.filter((item) => item.status === 'DEGRADED' || item.status === 'MAINTENANCE').length,
    checked: Object.keys(health).length,
    failures: Object.values(health).filter((item) => !item.ok || item.payload?.status === 'OFFLINE').length,
  }), [health, items]);

  return <AdminPage eyebrow="Provider Operations" title="Provider Health" description="ภาพรวมสถานะ การตั้งค่า และผล Health Check แบบ on-demand" actions={<AdminButton disabled={loading} onClick={() => void load()}>{loading ? 'กำลังโหลด...' : 'รีเฟรชรายการ'}</AdminButton>}>
    {message && <AdminNotice tone="warning">{message}</AdminNotice>}
    <AdminNotice tone="neutral">หน้านี้แสดงสถานะ Provider, readiness, latency จาก Health Check และปริมาณ webhook ที่บันทึกไว้ ส่วน error rate และ wallet mismatch ยังต้องใช้ endpoint aggregation เฉพาะก่อนนับงาน Provider observability ว่าเสร็จสมบูรณ์</AdminNotice>
    <AdminMetricGrid>
      <AdminMetric title="Providers" value={metrics.total.toLocaleString('th-TH')} helper="ทั้งหมด" />
      <AdminMetric title="Active" value={metrics.active.toLocaleString('th-TH')} helper="เปิดใช้งาน" tone="success" />
      <AdminMetric title="Attention" value={metrics.degraded.toLocaleString('th-TH')} helper="Maintenance หรือ Degraded" tone={metrics.degraded ? 'warning' : 'success'} />
      <AdminMetric title="Checked" value={metrics.checked.toLocaleString('th-TH')} helper="รอบนี้" />
      <AdminMetric title="Failed checks" value={metrics.failures.toLocaleString('th-TH')} helper="Offline หรือ request ล้มเหลว" tone={metrics.failures ? 'danger' : 'success'} />
    </AdminMetricGrid>
    <AdminCard title="Provider status matrix" description="ทดสอบแต่ละค่ายเพื่อดู latency และ readiness ล่าสุด">
      <AdminStack>{items.map((provider) => {
        const result = health[provider.id];
        const observed = result?.payload?.status;
        const tone = observed === 'OFFLINE' ? 'danger' : observed === 'DEGRADED' || provider.status === 'DEGRADED' || provider.status === 'MAINTENANCE' ? 'warning' : provider.status === 'ACTIVE' ? 'success' : 'neutral';
        return <article key={provider.id} style={rowStyle}>
          <div style={identityStyle}><div style={badgeStyle}><AdminBadge tone={tone}>{observed ?? provider.status}</AdminBadge><AdminBadge>{provider.walletMode}</AdminBadge></div><strong>{provider.name}</strong><small>{provider.code} · อัปเดต {new Date(provider.updatedAt).toLocaleString('th-TH')}</small></div>
          <div style={statsStyle}><span>Endpoints <strong>{provider._count?.endpoints ?? 0}</strong></span><span>Credentials <strong>{provider._count?.credentials ?? 0}</strong></span><span>Games <strong>{provider._count?.games ?? 0}</strong></span><span>Webhook logs <strong>{provider._count?.webhookLogs ?? 0}</strong></span><span>Latency <strong>{result?.payload?.latencyMs != null ? `${result.payload.latencyMs} ms` : '-'}</strong></span><span>Readiness <strong>{result?.readiness ? `${result.readiness.passed ?? 0}/${result.readiness.total ?? 0}` : '-'}</strong></span></div>
          <div style={actionsStyle}><AdminButton disabled={checkingId === provider.id} onClick={() => void check(provider)}>{checkingId === provider.id ? 'กำลังตรวจ...' : 'Health Check'}</AdminButton><AdminLinkButton href={`/game-providers`}>ตั้งค่าค่าย</AdminLinkButton></div>
        </article>;
      })}{!loading && items.length === 0 && <AdminEmpty>ยังไม่มี Provider</AdminEmpty>}</AdminStack>
    </AdminCard>
  </AdminPage>;
}

const rowStyle = { display: 'grid', gridTemplateColumns: 'minmax(190px,.8fr) minmax(300px,1.5fr) auto', gap: 16, alignItems: 'center', padding: 14, border: '1px solid rgba(148,163,184,.16)', borderRadius: 14 } as const;
const identityStyle = { display: 'grid', gap: 5, minWidth: 0 } as const;
const badgeStyle = { display: 'flex', gap: 7, flexWrap: 'wrap' } as const;
const statsStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 8, color: '#94a3b8', fontSize: 12 } as const;
const actionsStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' } as const;
