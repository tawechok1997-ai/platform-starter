'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminStack, AdminToolbar } from '../_components/admin-ui';
import { formatMoney, ledgerLabel } from '../_components/human-labels';

type Ledger = { id: string; type: string; direction: string; amount: string; balanceBefore: string; balanceAfter: string; referenceType?: string | null; referenceId?: string | null; idempotencyKey?: string | null; metadata?: unknown; createdAt: string; user?: { username?: string | null; phone?: string | null } | null; wallet?: { currency?: string | null } | null };

export default function WalletLedgersPage() {
  const [items, setItems] = useState<Ledger[]>([]);
  const [message, setMessage] = useState('กำลังโหลดประวัติเงิน...');
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState('ALL');
  const [query, setQuery] = useState('');

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    setMessage('กำลังโหลดประวัติเงิน...');
    const res = await adminApiFetch('/admin/money-ops/ledger?take=100');
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดประวัติเงินไม่สำเร็จ'); return; }
    setItems(data.items ?? []);
    setMessage('');
  }

  const visibleItems = useMemo(() => items.filter((item) => {
    const matchesDirection = direction === 'ALL' || item.direction === direction;
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [item.user?.username, item.user?.phone, item.referenceType, item.referenceId, item.idempotencyKey, item.type].some((value) => String(value ?? '').toLowerCase().includes(needle));
    return matchesDirection && matchesQuery;
  }), [items, direction, query]);

  const credit = visibleItems.filter((item) => item.direction === 'CREDIT').length;
  const debit = visibleItems.filter((item) => item.direction === 'DEBIT').length;
  const game = visibleItems.filter((item) => item.referenceType?.includes('GAME')).length;

  return <AdminPage eyebrow="การเงิน" title="ประวัติเงิน" description="ดูเงินเข้าและเงินออกของวอเลต พร้อมยอดก่อนและยอดหลังรายการ" actions={<AdminButton onClick={() => void load()} disabled={loading}>รีเฟรช</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid>
      <AdminMetric title="รายการที่แสดง" value={String(visibleItems.length)} helper={`จาก ${items.length} รายการล่าสุด`} />
      <AdminMetric title="เงินเข้า" value={String(credit)} helper="เพิ่มยอดวอเลต" tone="success" />
      <AdminMetric title="เงินออก" value={String(debit)} helper="ลดยอดวอเลต" tone="warning" />
      <AdminMetric title="เกี่ยวกับเกม" value={String(game)} helper="โยกเงินเกมหรือคืนยอด" />
    </AdminMetricGrid>

    <AdminToolbar>
      <label className="admin-ledger-field"><span>ค้นหา</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="สมาชิก อ้างอิง หรือรหัสกันซ้ำ" /></label>
      <label className="admin-ledger-field"><span>ทิศทางเงิน</span><select value={direction} onChange={(event) => setDirection(event.target.value)}><option value="ALL">ทั้งหมด</option><option value="CREDIT">เงินเข้า</option><option value="DEBIT">เงินออก</option></select></label>
      <div className="admin-ledger-guidance">ยอดก่อน + จำนวนรายการ = ยอดหลัง ต้องตรวจสอบต่อกันได้เสมอ</div>
    </AdminToolbar>

    <AdminStack>{visibleItems.map((item) => {
      const currency = item.wallet?.currency ?? 'THB';
      return <AdminCard key={item.id}>
        <article className="admin-ledger-card-grid">
          <section className="admin-ledger-identity">
            <div className="admin-ledger-title-row"><strong>{ledgerTitle(item)}</strong><AdminBadge tone={item.direction === 'CREDIT' ? 'success' : 'warning'}>{item.direction === 'CREDIT' ? 'เงินเข้า' : 'เงินออก'}</AdminBadge></div>
            <p>{item.user?.username ?? item.user?.phone ?? '-'} · {new Date(item.createdAt).toLocaleString('th-TH')}</p>
            <p>อ้างอิง: {item.referenceType ?? '-'} · {item.referenceId ?? '-'}</p>
          </section>
          <section className="admin-ledger-amount"><span>จำนวน</span><strong>{formatMoney(item.amount, currency)}</strong><AdminLinkButton href={`/wallet-ledgers/${item.id}`}>ดูรายละเอียด</AdminLinkButton></section>
          <section className="admin-ledger-balance-grid"><div><span>ยอดก่อน</span><strong>{formatMoney(item.balanceBefore, currency)}</strong></div><div><span>ยอดหลัง</span><strong>{formatMoney(item.balanceAfter, currency)}</strong></div><div><span>รหัสกันซ้ำ</span><strong>{item.idempotencyKey ?? '-'}</strong></div></section>
          {item.metadata && <details className="admin-ledger-details"><summary>ข้อมูลเทคนิค</summary><pre>{JSON.stringify(item.metadata, null, 2)}</pre></details>}
        </article>
      </AdminCard>;
    })}{!loading && visibleItems.length === 0 && <AdminEmpty>ไม่พบประวัติเงินตามตัวกรอง</AdminEmpty>}</AdminStack>
  </AdminPage>;
}

function ledgerTitle(item: Ledger) { if (item.referenceType?.includes('GAME')) return item.direction === 'DEBIT' ? 'โยกเข้าเกม' : item.type === 'REVERSAL' ? 'คืนเงินกลับวอเลต' : 'โยกกลับวอเลต'; return ledgerLabel(item.type); }
