'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage } from '../_components/admin-ui';
import { AdminDataColumn, AdminDataTable } from '../_components/admin-data-table';

type Provider = { id: string; name: string; code: string; status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DEGRADED'; walletMode: string; updatedAt: string; _count?: { endpoints?: number; credentials?: number; games?: number; sessions?: number; transfers?: number; webhookLogs?: number } };
type HealthResult = { ok: boolean; payload?: { status?: 'ONLINE' | 'OFFLINE' | 'DEGRADED'; latencyMs?: number }; readiness?: { ready?: boolean; passed?: number; total?: number }; checkedAt?: string };
type WebhookSummary = { total?: number; processed?: number; failed?: number; duplicate?: number };
type WalletSummary = { total?: number; matched?: number; mismatch?: number; unknown?: number };

export default function ProviderHealthPage() {
  const [items, setItems] = useState<Provider[]>([]);
  const [health, setHealth] = useState<Record<string, HealthResult>>({});
  const [webhook, setWebhook] = useState<WebhookSummary>({});
  const [wallet, setWallet] = useState<WalletSummary>({});
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true); setMessage('');
    const [providerRes, webhookRes, walletRes] = await Promise.all([
      adminApiFetch('/admin/game-providers'),
      adminApiFetch('/admin/webhook-logs'),
      adminApiFetch('/admin/provider-wallet-snapshots'),
    ]);
    const [providerData, webhookData, walletData] = await Promise.all([
      providerRes.json().catch(() => null), webhookRes.json().catch(() => null), walletRes.json().catch(() => null),
    ]);
    setLoading(false);
    if (providerRes.ok) setItems(providerData?.items ?? []); else setMessage(providerData?.message ?? 'โหลด Provider ไม่สำเร็จ');
    if (webhookRes.ok) setWebhook(webhookData?.summary ?? {});
    if (walletRes.ok) setWallet(walletData?.summary ?? {});
  }

  async function check(provider: Provider) {
    setCheckingId(provider.id);
    const started = performance.now();
    const res = await adminApiFetch(`/admin/game-providers/${provider.id}/health-check`, { method: 'POST' });
    const data = await res.json().catch(() => null);
    const measuredLatency = Math.max(0, Math.round(performance.now() - started));
    setCheckingId('');
    if (!res.ok) { setHealth((current) => ({ ...current, [provider.id]: { ok: false, payload: { status: 'OFFLINE', latencyMs: measuredLatency }, checkedAt: new Date().toISOString() } })); return; }
    setHealth((current) => ({ ...current, [provider.id]: { ...data, payload: { ...data?.payload, latencyMs: Number(data?.payload?.latencyMs ?? measuredLatency) } } }));
  }

  const metrics = useMemo(() => {
    const checked = Object.values(health);
    const failures = checked.filter((item) => !item.ok || item.payload?.status === 'OFFLINE').length;
    const latencies = checked.map((item) => Number(item.payload?.latencyMs ?? 0)).filter((value) => value > 0);
    const webhookTotal = Number(webhook.total ?? 0);
    const webhookFailed = Number(webhook.failed ?? 0);
    const mismatch = Number(wallet.mismatch ?? 0);
    return {
      total: items.length,
      degraded: items.filter((item) => item.status === 'DEGRADED' || item.status === 'MAINTENANCE').length,
      checked: checked.length,
      failures,
      averageLatency: latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length) : 0,
      errorRate: checked.length ? Math.round((failures / checked.length) * 1000) / 10 : 0,
      webhookFailureRate: webhookTotal ? Math.round((webhookFailed / webhookTotal) * 1000) / 10 : 0,
      mismatch,
    };
  }, [health, items, wallet.mismatch, webhook.failed, webhook.total]);

  const columns: AdminDataColumn<Provider>[] = [
    { key: 'provider', title: 'Provider', render: (provider) => <div><strong>{provider.name}</strong><small style={{ display: 'block', color: '#94a3b8' }}>{provider.code}</small></div>, sortValue: (provider) => provider.name, searchValue: (provider) => `${provider.name} ${provider.code}` },
    { key: 'status', title: 'Status', render: (provider) => { const result = health[provider.id]; return <AdminBadge tone={providerTone(provider, result)}>{result?.payload?.status ?? provider.status}</AdminBadge>; }, sortValue: (provider) => health[provider.id]?.payload?.status ?? provider.status },
    { key: 'latency', title: 'Latency', render: (provider) => { const latencyMs = health[provider.id]?.payload?.latencyMs; return latencyMs != null ? `${latencyMs} ms` : '-'; }, sortValue: (provider) => Number(health[provider.id]?.payload?.latencyMs ?? 0), align: 'right' },
    { key: 'readiness', title: 'Readiness', render: (provider) => { const readiness = health[provider.id]?.readiness; return readiness ? `${readiness.passed ?? 0}/${readiness.total ?? 0}` : '-'; }, sortValue: (provider) => Number(health[provider.id]?.readiness?.passed ?? 0), align: 'center' },
    { key: 'games', title: 'Games', render: (provider) => Number(provider._count?.games ?? 0).toLocaleString('th-TH'), sortValue: (provider) => Number(provider._count?.games ?? 0), align: 'right' },
    { key: 'webhooks', title: 'Webhook logs', render: (provider) => Number(provider._count?.webhookLogs ?? 0).toLocaleString('th-TH'), sortValue: (provider) => Number(provider._count?.webhookLogs ?? 0), align: 'right' },
    { key: 'actions', title: 'Actions', render: (provider) => <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><AdminButton disabled={checkingId === provider.id} onClick={() => void check(provider)}>{checkingId === provider.id ? 'กำลังตรวจ...' : 'Health Check'}</AdminButton><AdminLinkButton href="/game-providers">ตั้งค่าค่าย</AdminLinkButton></div>, defaultVisible: true },
  ];

  return <AdminPage eyebrow="Provider Operations" title="Provider Health" description="สถานะ Latency Error rate Webhook failure และ Wallet mismatch จากข้อมูลระบบจริง" actions={<AdminButton disabled={loading} onClick={() => void load()}>{loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}</AdminButton>}>
    {message && <AdminNotice tone="warning">{message}</AdminNotice>}
    <AdminMetricGrid>
      <AdminMetric title="Providers" value={metrics.total.toLocaleString('th-TH')} helper={`${metrics.degraded} ต้องเฝ้าระวัง`} tone={metrics.degraded ? 'warning' : 'success'} />
      <AdminMetric title="Avg latency" value={metrics.averageLatency ? `${metrics.averageLatency} ms` : '-'} helper={`${metrics.checked} ค่ายที่ตรวจรอบนี้`} tone={metrics.averageLatency > 1500 ? 'warning' : 'success'} />
      <AdminMetric title="Health error rate" value={`${metrics.errorRate}%`} helper={`${metrics.failures}/${metrics.checked || 0} checks`} tone={metrics.errorRate ? 'danger' : 'success'} />
      <AdminMetric title="Webhook failure" value={`${metrics.webhookFailureRate}%`} helper={`${webhook.failed ?? 0}/${webhook.total ?? 0} logs`} tone={metrics.webhookFailureRate ? 'warning' : 'success'} />
      <AdminMetric title="Wallet mismatch" value={metrics.mismatch.toLocaleString('th-TH')} helper={`${wallet.total ?? 0} snapshots`} tone={metrics.mismatch ? 'danger' : 'success'} />
    </AdminMetricGrid>
    <AdminDataTable id="provider-health" rows={items} columns={columns} rowKey={(provider) => provider.id} loading={loading} error={message} emptyText="ยังไม่มี Provider" searchPlaceholder="ค้นหาชื่อหรือรหัส Provider" />
  </AdminPage>;
}

function providerTone(provider: Provider, result?: HealthResult) {
  const observed = result?.payload?.status;
  if (observed === 'OFFLINE') return 'danger';
  if (observed === 'DEGRADED' || provider.status === 'DEGRADED' || provider.status === 'MAINTENANCE') return 'warning';
  if (provider.status === 'ACTIVE') return 'success';
  return 'neutral';
}
