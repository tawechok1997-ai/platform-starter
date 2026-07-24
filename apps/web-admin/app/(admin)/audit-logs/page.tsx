'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCode,
  AdminDataValue,
  AdminEmpty,
  AdminLinkButton,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminPagination,
  AdminPayloadViewer,
  AdminStack,
} from '../_components/admin-ui';

type AuditLog = {
  id: string;
  action: string;
  module: string;
  targetId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  oldData?: unknown;
  newData?: unknown;
  createdAt: string;
  adminUser?: { id: string; username: string; email: string } | null;
};

type AuditFilters = {
  search: string;
  module: string;
  action: string;
  admin: string;
  targetId: string;
  from: string;
  to: string;
};

const PAGE_SIZE = 20;
const emptyFilters: AuditFilters = { search: '', module: '', action: '', admin: '', targetId: '', from: '', to: '' };

export default function AdminAuditPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [draft, setDraft] = useState<AuditFilters>(emptyFilters);
  const [applied, setApplied] = useState<AuditFilters>(emptyFilters);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { void loadAuditLogs(page, applied); }, [page, applied]);

  const moduleCount = useMemo(() => new Set(items.map((item) => item.module)).size, [items]);
  const adminCount = useMemo(() => new Set(items.map((item) => item.adminUser?.id).filter(Boolean)).size, [items]);
  const activeFilters = useMemo(() => Object.entries(applied).filter(([, value]) => value.trim()), [applied]);

  async function loadAuditLogs(nextPage = page, filters = applied) {
    setLoading(true);
    setMessage('กำลังโหลดบันทึกกิจกรรม...');
    try {
      const params = new URLSearchParams({ page: String(nextPage), take: String(PAGE_SIZE) });
      Object.entries(filters).forEach(([key, value]) => { if (value.trim()) params.set(key, value.trim()); });
      const res = await adminApiFetch(`/admin/audit-logs?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !Array.isArray(data.items)) throw new Error('load');
      setItems(data.items as AuditLog[]);
      setTotal(Number(data.total ?? 0));
      setPageCount(Math.max(Number(data.pageCount ?? 1), 1));
      setMessage('');
    } catch {
      setItems([]);
      setTotal(0);
      setPageCount(1);
      setMessage('โหลดบันทึกกิจกรรมไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    if (loading) return;
    setPage(1);
    setApplied({ ...draft });
  }

  function clearFilters() {
    if (loading) return;
    setDraft(emptyFilters);
    setPage(1);
    setApplied({ ...emptyFilters });
  }

  return <AdminPage
    eyebrow="ความปลอดภัยและการตรวจสอบ"
    title="บันทึกกิจกรรมผู้ดูแล"
    description="ตรวจว่าใครทำอะไร เมื่อใด จากอุปกรณ์ใด และข้อมูลเปลี่ยนอย่างไร"
    actions={<AdminButton size="compact" disabled={loading} onClick={() => void loadAuditLogs(page, applied)}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}
  >
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}

    <AdminMetricGrid>
      <AdminMetric title="รายการในหน้านี้" value={items.length.toLocaleString('th-TH')} helper={`${total.toLocaleString('th-TH')} รายการทั้งหมด`} />
      <AdminMetric title="หน้า" value={`${page}/${pageCount}`} helper={`${PAGE_SIZE} รายการต่อหน้า`} />
      <AdminMetric title="หมวดงาน" value={moduleCount.toLocaleString('th-TH')} helper="จากรายการในหน้านี้" />
      <AdminMetric title="ผู้ดูแล" value={adminCount.toLocaleString('th-TH')} helper="จากรายการในหน้านี้" />
      <AdminMetric title="สิทธิ์" value="อ่านอย่างเดียว" helper="หน้านี้ไม่แก้ไขข้อมูล" />
    </AdminMetricGrid>

    <AdminCard title="ค้นหาและกรอง" description="ค้นหาจากข้อความ หมวดงาน ผู้ดูแล รหัสรายการ หรือช่วงเวลา">
      <div style={filterGridStyle}>
        <label style={fieldStyle}><span>ค้นหาทั้งหมด</span><input disabled={loading} value={draft.search} onChange={(event) => setDraft((value) => ({ ...value, search: event.target.value }))} placeholder="การดำเนินการ หมวดงาน รหัสรายการ หรือ IP" style={inputStyle} /></label>
        <label style={fieldStyle}><span>หมวดงาน</span><input disabled={loading} value={draft.module} onChange={(event) => setDraft((value) => ({ ...value, module: event.target.value }))} placeholder="เช่น ฝาก ถอน หรือสมาชิก" style={inputStyle} /></label>
        <label style={fieldStyle}><span>การดำเนินการ</span><input disabled={loading} value={draft.action} onChange={(event) => setDraft((value) => ({ ...value, action: event.target.value }))} placeholder="เช่น อนุมัติ ปฏิเสธ หรือเข้าสู่ระบบ" style={inputStyle} /></label>
        <label style={fieldStyle}><span>ผู้ดูแล</span><input disabled={loading} value={draft.admin} onChange={(event) => setDraft((value) => ({ ...value, admin: event.target.value }))} placeholder="ชื่อหรืออีเมล" style={inputStyle} /></label>
        <label style={fieldStyle}><span>รหัสรายการ</span><input disabled={loading} value={draft.targetId} onChange={(event) => setDraft((value) => ({ ...value, targetId: event.target.value }))} placeholder="UUID หรือรหัสอ้างอิง" style={inputStyle} /></label>
        <label style={fieldStyle}><span>ตั้งแต่วันที่</span><input disabled={loading} type="date" value={draft.from} onChange={(event) => setDraft((value) => ({ ...value, from: event.target.value }))} style={inputStyle} /></label>
        <label style={fieldStyle}><span>ถึงวันที่</span><input disabled={loading} type="date" value={draft.to} min={draft.from || undefined} onChange={(event) => setDraft((value) => ({ ...value, to: event.target.value }))} style={inputStyle} /></label>
      </div>
      <div style={filterActionStyle}>
        <AdminButton disabled={loading} onClick={applyFilters}>ใช้ตัวกรอง</AdminButton>
        <AdminButton disabled={loading} tone="secondary" onClick={clearFilters}>ล้างตัวกรอง</AdminButton>
      </div>
      {activeFilters.length > 0 && <div style={chipWrapStyle}>{activeFilters.map(([key, value]) => <AdminBadge key={key} tone="warning">{filterLabel(key)}: {value}</AdminBadge>)}</div>}
    </AdminCard>

    <AdminCard title="รายการกิจกรรม" description="เปิดข้อมูลก่อนและหลังเพื่อตรวจสอบการเปลี่ยนแปลง">
      <AdminStack>
        {items.map((item) => {
          const href = targetHref(item.module, item.targetId);
          return <article key={item.id} style={logBoxStyle}>
            <header style={logTopStyle}>
              <div style={badgeWrapStyle}>
                <AdminBadge tone="neutral">{moduleLabel(item.module)}</AdminBadge>
                <AdminBadge tone={actionTone(item.action)}>{actionLabel(item.action)}</AdminBadge>
              </div>
              <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('th-TH')}</time>
            </header>

            <div style={summaryGridStyle}>
              <AdminDataValue label="ผู้ดูแล">{item.adminUser?.username ?? item.adminUser?.email ?? 'ไม่พบข้อมูลผู้ดูแล'}</AdminDataValue>
              <AdminDataValue label="อีเมล">{item.adminUser?.email ?? '-'}</AdminDataValue>
              <AdminDataValue label="รหัสรายการ"><AdminCode {...(item.targetId ? { title: item.targetId } : {})}>{item.targetId || '-'}</AdminCode></AdminDataValue>
              <AdminDataValue label="ที่อยู่ IP"><AdminCode>{item.ipAddress || '-'}</AdminCode></AdminDataValue>
            </div>

            <AdminDataValue label="อุปกรณ์และเบราว์เซอร์">{item.userAgent || '-'}</AdminDataValue>

            <div style={detailGridStyle}>
              <AuditData title="ข้อมูลก่อนเปลี่ยน" value={item.oldData} />
              <AuditData title="ข้อมูลหลังเปลี่ยน" value={item.newData} />
            </div>

            {href && <div style={linkRowStyle}><AdminLinkButton size="compact" href={href}>เปิดรายการที่เกี่ยวข้อง</AdminLinkButton></div>}
          </article>;
        })}
        {!loading && items.length === 0 && <AdminEmpty>ไม่พบบันทึกกิจกรรมตามเงื่อนไขนี้</AdminEmpty>}
      </AdminStack>

      <AdminPagination
        page={page}
        totalPages={pageCount}
        disabled={loading}
        onPrevious={() => setPage((value) => Math.max(value - 1, 1))}
        onNext={() => setPage((value) => Math.min(value + 1, pageCount))}
      />
    </AdminCard>
  </AdminPage>;
}

function AuditData({ title, value }: { title: string; value: unknown }) {
  return <details style={detailsStyle}>
    <summary>{title}</summary>
    <div style={payloadWrapStyle}><AdminPayloadViewer payload={value} emptyLabel="ไม่มีข้อมูล" maxHeight={360} /></div>
  </details>;
}

function targetHref(moduleName: string, targetId?: string | null) {
  if (!targetId) return null;
  const module = moduleName.toLowerCase();
  if (module.includes('topup')) return `/topups?requestId=${encodeURIComponent(targetId)}`;
  if (module.includes('withdraw')) return `/withdrawals?requestId=${encodeURIComponent(targetId)}`;
  if (module.includes('member') || module.includes('user')) return `/members/${encodeURIComponent(targetId)}`;
  if (module.includes('wallet') || module.includes('ledger') || module.includes('money')) return `/ledgers?referenceId=${encodeURIComponent(targetId)}`;
  if (module.includes('risk')) return `/risk-alerts/${encodeURIComponent(targetId)}`;
  if (module.includes('admin-access') || module.includes('admin_access')) return '/access';
  if (module.includes('anti-bot') || module.includes('anti_bot') || module.includes('security')) return '/anti-bot';
  if (module.includes('auth')) return '/security';
  return null;
}

function actionTone(action: string) {
  const value = action.toLowerCase();
  if (value.includes('reject') || value.includes('revoke') || value.includes('fail') || value.includes('delete')) return 'danger';
  if (value.includes('approve') || value.includes('complete') || value.includes('confirm') || value.includes('create')) return 'success';
  if (value.includes('claim') || value.includes('review') || value.includes('update')) return 'warning';
  return 'neutral';
}

function actionLabel(action: string) {
  const value = action.toLowerCase();
  if (value.includes('approve')) return 'อนุมัติ';
  if (value.includes('reject')) return 'ปฏิเสธ';
  if (value.includes('confirm')) return 'ยืนยัน';
  if (value.includes('complete')) return 'ดำเนินการสำเร็จ';
  if (value.includes('create')) return 'สร้างข้อมูล';
  if (value.includes('update')) return 'แก้ไขข้อมูล';
  if (value.includes('delete')) return 'ลบข้อมูล';
  if (value.includes('claim')) return 'รับงาน';
  if (value.includes('release')) return 'ปล่อยงาน';
  if (value.includes('login')) return 'เข้าสู่ระบบ';
  if (value.includes('logout')) return 'ออกจากระบบ';
  return action;
}

function moduleLabel(moduleName: string) {
  const value = moduleName.toLowerCase();
  if (value.includes('topup')) return 'รายการฝาก';
  if (value.includes('withdraw')) return 'รายการถอน';
  if (value.includes('member') || value.includes('user')) return 'สมาชิก';
  if (value.includes('wallet')) return 'กระเป๋าเงิน';
  if (value.includes('ledger') || value.includes('money')) return 'บัญชีแยกประเภท';
  if (value.includes('risk')) return 'ความเสี่ยง';
  if (value.includes('auth')) return 'การเข้าสู่ระบบ';
  if (value.includes('access')) return 'สิทธิ์ผู้ดูแล';
  return moduleName || 'ไม่ระบุหมวด';
}

function filterLabel(key: string) {
  const labels: Record<string, string> = { search: 'ค้นหา', module: 'หมวดงาน', action: 'การดำเนินการ', admin: 'ผู้ดูแล', targetId: 'รหัสรายการ', from: 'ตั้งแต่', to: 'ถึง' };
  return labels[key] ?? key;
}

const filterGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px, 100%), 1fr))', gap: 12 } as const;
const fieldStyle = { display: 'grid', gap: 6, minWidth: 0, color: '#cbd5e1', fontSize: 13 } as const;
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0, width: '100%', boxSizing: 'border-box' as const };
const filterActionStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 10, marginTop: 12 } as const;
const chipWrapStyle = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 } as const;
const logBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 18, padding: 14, display: 'grid', gap: 14, minWidth: 0 } as const;
const logTopStyle = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' } as const;
const badgeWrapStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' } as const;
const summaryGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 12 } as const;
const detailGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 10 } as const;
const detailsStyle = { border: '1px solid rgba(148,163,184,.16)', borderRadius: 12, padding: 10, minWidth: 0 } as const;
const payloadWrapStyle = { marginTop: 10 } as const;
const linkRowStyle = { display: 'flex', justifyContent: 'flex-end' } as const;