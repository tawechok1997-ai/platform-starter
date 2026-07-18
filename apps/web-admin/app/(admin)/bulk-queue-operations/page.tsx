'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBulkAction } from '../_components/admin-bulk-action';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminNotice, AdminPage, AdminToolbar, formatMoney } from '../_components/admin-ui';

type QueueKind = 'topups' | 'withdrawals';
type QueueItem = { id: string; amount: string; status: string; createdAt: string; claimedBy?: string | null; user?: { username?: string | null; phone?: string | null } | null };

export default function BulkQueueOperationsPage() {
  const [kind, setKind] = useState<QueueKind>('topups');
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<'claim' | 'release'>('claim');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => { void load(); }, [kind]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  async function load() {
    setLoading(true); setMessage('กำลังโหลดคิว...'); setSelected([]);
    const status = kind === 'topups' ? 'PENDING_SLIP_REVIEW' : 'PENDING_REVIEW';
    const res = await adminApiFetch(`/admin/${kind}?status=${status}&page=1&take=50`);
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดคิวไม่สำเร็จ'); return; }
    setItems(data?.items ?? []); setMessage('');
  }

  async function execute(id: string) {
    const res = await adminApiFetch(`/admin/${kind}/${id}/${action}`, { method: 'POST' });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message ?? 'ทำรายการไม่สำเร็จ');
  }

  function toggle(id: string) { setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]); }
  function toggleAll() { setSelected(selected.length === items.length ? [] : items.map((item) => item.id)); }

  return <AdminPage eyebrow="Finance Workflow" title="Bulk Queue Operations" description="รับหรือปล่อยงานหลายรายการแบบมีเหตุผล คำยืนยัน และผลลัพธ์รายแถว">
    <AdminNotice tone="warning">Bulk action หน้านี้จำกัดเฉพาะ Claim และ Release ซึ่งไม่เปลี่ยนยอดเงินจริง ส่วน Approve, Reject และ Confirm payment ต้องใช้ batch endpoint พร้อม step-up authentication ก่อนเปิดใช้งาน</AdminNotice>
    <AdminToolbar>
      <label>ประเภทคิว <select value={kind} onChange={(event) => setKind(event.target.value as QueueKind)}><option value="topups">ฝาก</option><option value="withdrawals">ถอน</option></select></label>
      <label>การทำงาน <select value={action} onChange={(event) => setAction(event.target.value as 'claim' | 'release')}><option value="claim">รับงาน</option><option value="release">ปล่อยงาน</option></select></label>
      <AdminButton tone="secondary" onClick={toggleAll}>{selected.length === items.length && items.length > 0 ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}</AdminButton>
      <AdminButton tone="secondary" onClick={() => void load()}>รีเฟรช</AdminButton>
    </AdminToolbar>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminCard title="รายการในคิว" description={`${items.length} รายการล่าสุด`}>
      <div className="admin-data-table-wrap"><table className="admin-data-table"><thead><tr><th>เลือก</th><th>สมาชิก</th><th>จำนวนเงิน</th><th>สถานะ</th><th>สร้างเมื่อ</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><input type="checkbox" checked={selectedSet.has(item.id)} onChange={() => toggle(item.id)} aria-label={`เลือก ${item.id}`} /></td><td>{item.user?.username ?? item.user?.phone ?? item.id.slice(0, 8)}</td><td>{formatMoney(item.amount)}</td><td><AdminBadge tone={item.claimedBy ? 'success' : 'warning'}>{item.claimedBy ? 'มีผู้รับงาน' : item.status}</AdminBadge></td><td>{new Date(item.createdAt).toLocaleString('th-TH')}</td></tr>)}{!loading && items.length === 0 && <tr><td colSpan={5}><AdminEmpty>ไม่มีรายการในคิว</AdminEmpty></td></tr>}</tbody></table></div>
    </AdminCard>
    <AdminBulkAction selectedIds={selected} actionLabel={action === 'claim' ? 'รับงานหลายรายการ' : 'ปล่อยงานหลายรายการ'} confirmText={action === 'claim' ? 'CLAIM' : 'RELEASE'} onExecute={execute} onDone={() => void load()} />
  </AdminPage>;
}
