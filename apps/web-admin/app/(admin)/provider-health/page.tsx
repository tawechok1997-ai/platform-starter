'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage } from '../_components/admin-ui';
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
    if (providerRes.ok) setItems(providerData?.items ?? []); else setMessage(providerData?.message ?? 'โหลดข้อมูลค่ายเกมไม่สำเร็จ');
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
    if (!res.ok) {
      setHealth((current) => ({ ...current, [provider.id]: { ok: false, payload: { status: 'OFFLINE', latencyMs: measuredLatency }, checkedAt: new Date().toISOString() } }));
      return;
    }
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
    { key: 'provider', title: 'ค่ายเกม', render: (provider) => <div><strong>{provider.name}</strong><small style={{ display: 'block', color: '#94a3b8' }}>{provider.code}</small></div>, sortValue: (provider) => provider.name, searchValue: (provider) => `${provider.name} ${provider.code}` },
    { key: 'status', title: 'สถานะ', render: (provider) => { const result = health[provider.id]; return <AdminBadge tone={providerTone(provider, result)}>{providerStatusLabel(result?.payload?.status ?? provider.status)}</AdminBadge>; }, sortValue: (provider) => health[provider.id]?.payload?.status ?? provider.status },
    { key: 'latency', title: 'เวลาตอบสนอง', render: (provider) => { const latencyMs = health[provider.id]?.payload?.latencyMs; return latencyMs != null ? `${latencyMs} ms` : '-'; }, sortValue: (provider) => Number(health[provider.id]?.payload?.latencyMs ?? 0), align: 'right' },
    { key: 'readiness', title: 'ความพร้อม', render: (provider) => { const readiness = health[provider.id]?.readiness; return readiness ? `${readiness.passed ?? 0}/${readiness.total ?? 0}` : '-'; }, sortValue: (provider) => Number(health[provider.id]?.readiness?.passed ?? 0), align: 'center' },
    { key: 'games', title: 'เกม', render: (provider) => Number(provider._count?.games ?? 0).toLocaleString('th-TH'), sortValue: (provider) => Number(provider._count?.games ?? 0), align: 'right' },
    { key: 'webhooks', title: 'Webhook', render: (provider) => Number(provider._count?.webhookLogs ?? 0).toLocaleString('th-TH'), sortValue: (provider) => Number(provider._count?.webhookLogs ?? 0), align: 'right' },
    { key: 'actions', title: 'จัดการ', render: (provider) => <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><AdminButton disabled={checkingId === provider.id} onClick={() => void check(provider)}>{checkingId === provider.id ? 'กำลังตรวจ...' : 'ตรวจการเชื่อมต่อ'}</AdminButton><AdminLinkButton href="/game-providers">ตั้งค่าค่าย</AdminLinkButton></div>, defaultVisible: true },
  ];

  return <AdminPage eyebrow="ค่ายเกม" title="สถานะค่ายเกม" description="ดูการเชื่อมต่อ เวลาตอบสนอง Webhook และยอดเงินที่ไม่ตรงกันในหน้าเดียว" actions={<AdminButton disabled={loading} onClick={() => void load()}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    {message && <AdminNotice tone="warning">{message}</AdminNotice>}
    <AdminMetricGrid>
      <AdminMetric title="ค่ายทั้งหมด" value={metrics.total.toLocaleString('th-TH')} helper={`${metrics.degraded} ค่ายต้องตรวจ`} tone={metrics.degraded ? 'warning' : 'success'} />
      <AdminMetric title="เวลาตอบสนองเฉลี่ย" value={metrics.averageLatency ? `${metrics.averageLatency} ms` : '-'} helper={`ตรวจแล้ว ${metrics.checked} ค่าย`} tone={metrics.averageLatency > 1500 ? 'warning' : 'success'} />
      <AdminMetric title="ตรวจไม่ผ่าน" value={`${metrics.errorRate}%`} helper={`${metrics.failures} จาก ${metrics.checked || 0} ครั้ง`} tone={metrics.errorRate ? 'danger' : 'success'} />
      <AdminMetric title="Webhook ผิดพลาด" value={`${metrics.webhookFailureRate}%`} helper={`${webhook.failed ?? 0} จาก ${webhook.total ?? 0} รายการ`} tone={metrics.webhookFailureRate ? 'warning' : 'success'} />
      <AdminMetric title="ยอดเงินไม่ตรง" value={metrics.mismatch.toLocaleString('th-TH')} helper={`ตรวจ ${wallet.total ?? 0} รายการ`} tone={metrics.mismatch ? 'danger' : 'success'} />
    </AdminMetricGrid>
    <AdminDataTable id="provider-health" rows={items} columns={columns} rowKey={(provider) => provider.id} loading={loading} error={message} emptyText="ยังไม่มีข้อมูลค่ายเกม" searchPlaceholder="ค้นหาชื่อหรือรหัสค่าย" />
  </AdminPage>;
}

function providerTone(provider: Provider, result?: HealthResult) {
  const observed = result?.payload?.status;
  if (observed === 'OFFLINE') return 'danger';
  if (observed === 'DEGRADED' || provider.status === 'DEGRADED' || provider.status === 'MAINTENANCE') return 'warning';
  if (provider.status === 'ACTIVE') return 'success';
  return 'neutral';
}

function providerStatusLabel(status: string) {
  const labels: Record<string, string> = { ONLINE: 'ออนไลน์', OFFLINE: 'ออฟไลน์', DEGRADED: 'ทำงานไม่เต็มที่', ACTIVE: 'พร้อมใช้งาน', INACTIVE: 'ปิดใช้งาน', MAINTENANCE: 'ปิดปรับปรุง' };
  return labels[status] ?? status;
}
