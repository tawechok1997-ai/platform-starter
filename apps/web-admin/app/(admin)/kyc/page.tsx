'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

const STATUS_OPTIONS = ['', 'DRAFT', 'SUBMITTED', 'REVIEWING', 'APPROVED', 'REJECTED', 'EXPIRED'];
type KycCase = { id: string; memberId: string; status: string; riskLevel: string; version: number; createdAt: string; submittedAt?: string | null; reviewedAt?: string | null; reviewNote?: string | null; documentCount?: number; member?: { username?: string; phone?: string | null; email?: string | null } };
type KycDocument = { id: string; caseId: string; memberId: string; documentType: string; status: string; originalName: string; mimeType: string; sizeBytes: number; version: number; reviewNote?: string | null; createdAt: string };
type ListResponse = { items?: KycCase[]; total?: number; page?: number; pageCount?: number };
type DetailResponse = { item?: KycCase; documents?: KycDocument[] };

export default function AdminKycPage() {
  const [items, setItems] = useState<KycCase[]>([]);
  const [selected, setSelected] = useState<KycCase | null>(null);
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [status, setStatus] = useState('SUBMITTED');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { void load(1); }, [status]);

  async function load(nextPage = page) {
    setLoading(true); setMessage('');
    const query = new URLSearchParams({ page: String(nextPage), take: '30' });
    if (status) query.set('status', status);
    const response = await adminApiFetch(`/admin/kyc/cases?${query.toString()}`);
    const data = await response.json().catch(() => null) as ListResponse | { message?: string } | null;
    if (!response.ok) setMessage((data as { message?: string } | null)?.message ?? 'โหลดคิว KYC ไม่สำเร็จ');
    else {
      const payload = data as ListResponse;
      setItems(payload.items ?? []);
      setTotal(Number(payload.total ?? 0));
      setPage(nextPage);
      setPageCount(Math.max(Number(payload.pageCount ?? 1), 1));
    }
    setLoading(false);
  }

  async function openCase(item: KycCase) {
    setBusy(true); setMessage('');
    const response = await adminApiFetch(`/admin/kyc/cases/${item.id}`);
    const data = await response.json().catch(() => null) as DetailResponse | { message?: string } | null;
    if (!response.ok) setMessage((data as { message?: string } | null)?.message ?? 'โหลดรายละเอียด KYC ไม่สำเร็จ');
    else {
      const payload = data as DetailResponse;
      setSelected(payload.item ?? item);
      setDocuments(payload.documents ?? []);
      setNote(payload.item?.reviewNote ?? '');
    }
    setBusy(false);
  }

  async function reviewDocument(document: KycDocument, nextStatus: 'ACCEPTED' | 'REJECTED') {
    if (!selected) return;
    setBusy(true); setMessage('');
    const response = await adminApiFetch(`/admin/kyc/documents/${document.id}/review`, {
      method: 'PATCH', body: JSON.stringify({ status: nextStatus, note: note.trim() || undefined, version: document.version }),
    });
    const data = await response.json().catch(() => null);
    setMessage(response.ok ? `อัปเดตเอกสารเป็น ${statusLabel(nextStatus)} แล้ว` : data?.message ?? 'อัปเดตเอกสารไม่สำเร็จ');
    setBusy(false);
    if (response.ok) await openCase(selected);
  }

  async function reviewCase(nextStatus: 'REVIEWING' | 'APPROVED' | 'REJECTED') {
    if (!selected) return;
    setBusy(true); setMessage('');
    const response = await adminApiFetch(`/admin/kyc/cases/${selected.id}/review`, {
      method: 'PATCH', body: JSON.stringify({ status: nextStatus, note: note.trim() || undefined, version: selected.version }),
    });
    const data = await response.json().catch(() => null);
    setMessage(response.ok ? `อัปเดตเคสเป็น ${statusLabel(nextStatus)} แล้ว` : data?.message ?? 'อัปเดตเคสไม่สำเร็จ');
    setBusy(false);
    if (response.ok) { await load(page); await openCase({ ...selected, version: selected.version + 1, status: nextStatus }); }
  }

  async function download(document: KycDocument) {
    setBusy(true); setMessage('');
    const tokenResponse = await adminApiFetch(`/admin/kyc/documents/${document.id}/access-token`, { method: 'POST' });
    const tokenData = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok) { setMessage(tokenData?.message ?? 'ออก access token ไม่สำเร็จ'); setBusy(false); return; }
    const response = await adminApiFetch('/admin/kyc/documents/download', { method: 'POST', body: JSON.stringify({ token: tokenData.token }) });
    const data = await response.json().catch(() => null);
    if (!response.ok) setMessage(data?.message ?? 'ดาวน์โหลดเอกสารไม่สำเร็จ');
    else {
      const anchor = documentRef(data.dataUrl, data.fileName || document.originalName);
      anchor.click(); anchor.remove();
      setMessage('ดาวน์โหลดเอกสารผ่าน token อายุสั้นแล้ว');
    }
    setBusy(false);
  }

  const pending = items.filter((item) => ['SUBMITTED','REVIEWING'].includes(item.status)).length;
  const highRisk = items.filter((item) => item.riskLevel === 'HIGH').length;

  return <AdminPage eyebrow="Risk operations" title="ตรวจสอบ KYC" description="จัดการคิวตรวจเอกสารสมาชิก พร้อม optimistic version guard และ private document access">
    <AdminMetricGrid><AdminMetric title="ทั้งหมด" value={String(total)} helper="ตามตัวกรอง" /><AdminMetric title="รอตรวจ" value={String(pending)} helper="ในหน้าปัจจุบัน" /><AdminMetric title="ความเสี่ยงสูง" value={String(highRisk)} helper="ควรตรวจด่วน" /><AdminMetric title="หน้า" value={`${page}/${pageCount}`} helper="30 เคส/หน้า" /></AdminMetricGrid>
    <AdminToolbar>
      <label style={fieldStyle}>สถานะ<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} style={inputStyle}>{STATUS_OPTIONS.map((value) => <option key={value} value={value}>{value ? statusLabel(value) : 'ทั้งหมด'}</option>)}</select></label>
      <AdminButton tone="secondary" onClick={() => void load(page)} disabled={loading}>รีเฟรช</AdminButton>
      <AdminButton disabled={page <= 1 || loading} onClick={() => void load(page - 1)}>ก่อนหน้า</AdminButton>
      <AdminButton disabled={page >= pageCount || loading} onClick={() => void load(page + 1)}>ถัดไป</AdminButton>
    </AdminToolbar>
    {message && <AdminNotice>{message}</AdminNotice>}

    <div style={layoutStyle}>
      <AdminCard title="คิวตรวจ KYC" description="เลือกเคสเพื่อดูเอกสารและตัดสินผล">
        <AdminStack>{loading ? <AdminEmpty>กำลังโหลด...</AdminEmpty> : items.length === 0 ? <AdminEmpty>ไม่มีเคสตามตัวกรอง</AdminEmpty> : items.map((item) => <AdminRow key={item.id}>
          <div style={bodyStyle}><div style={badgeRowStyle}><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge><AdminBadge tone={item.riskLevel === 'HIGH' ? 'danger' : item.riskLevel === 'ENHANCED' ? 'warning' : 'neutral'}>{item.riskLevel}</AdminBadge></div><strong>{item.member?.username ?? item.memberId?.slice(0, 8) ?? '-'}</strong><span style={mutedStyle}>{item.member?.phone ?? '-'} · {item.member?.email ?? '-'}</span><span style={mutedStyle}>{item.documentCount ?? 0} เอกสาร · v{item.version} · {formatDate(item.createdAt)}</span></div>
          <AdminButton tone="secondary" onClick={() => void openCase(item)} disabled={busy}>เปิดเคส</AdminButton>
        </AdminRow>)}</AdminStack>
      </AdminCard>

      <AdminCard title={selected ? `เคส ${selected.id.slice(0, 8)}` : 'รายละเอียดเคส'} description={selected ? `${selected.member?.username ?? selected.memberId} · ${statusLabel(selected.status)}` : 'เลือกเคสจากคิวด้านซ้าย'}>
        {!selected ? <AdminEmpty>ยังไม่ได้เลือกเคส</AdminEmpty> : <AdminStack>
          <div style={summaryGridStyle}><Summary label="สถานะ" value={statusLabel(selected.status)} /><Summary label="Risk" value={selected.riskLevel} /><Summary label="Version" value={String(selected.version)} /><Summary label="เอกสาร" value={String(documents.length)} /></div>
          <label style={fieldStyle}>หมายเหตุผู้ตรวจ<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} maxLength={2000} style={inputStyle} placeholder="เหตุผลหรือรายละเอียดประกอบการตัดสิน" /></label>
          <div style={actionRowStyle}><AdminButton tone="secondary" disabled={busy || !['SUBMITTED','REVIEWING'].includes(selected.status)} onClick={() => void reviewCase('REVIEWING')}>กำลังตรวจ</AdminButton><AdminButton tone="success" disabled={busy || !['SUBMITTED','REVIEWING'].includes(selected.status)} onClick={() => void reviewCase('APPROVED')}>อนุมัติเคส</AdminButton><AdminButton tone="danger" disabled={busy || !['SUBMITTED','REVIEWING'].includes(selected.status)} onClick={() => void reviewCase('REJECTED')}>ปฏิเสธเคส</AdminButton></div>
          <div style={documentListStyle}>{documents.length === 0 ? <AdminEmpty>เคสนี้ยังไม่มีเอกสาร</AdminEmpty> : documents.map((document) => <article key={document.id} style={documentStyle}>
            <div style={bodyStyle}><div style={badgeRowStyle}><AdminBadge tone={statusTone(document.status)}>{statusLabel(document.status)}</AdminBadge><AdminBadge>{documentLabel(document.documentType)}</AdminBadge></div><strong>{document.originalName}</strong><span style={mutedStyle}>{document.mimeType} · {formatBytes(document.sizeBytes)} · v{document.version}</span>{document.reviewNote && <span style={noteStyle}>{document.reviewNote}</span>}</div>
            <div style={actionRowStyle}><AdminButton tone="secondary" onClick={() => void download(document)} disabled={busy}>ดาวน์โหลด</AdminButton><AdminButton tone="success" onClick={() => void reviewDocument(document, 'ACCEPTED')} disabled={busy || document.status === 'ACCEPTED'}>ผ่าน</AdminButton><AdminButton tone="danger" onClick={() => void reviewDocument(document, 'REJECTED')} disabled={busy || document.status === 'REJECTED'}>ไม่ผ่าน</AdminButton></div>
          </article>)}</div>
        </AdminStack>}
      </AdminCard>
    </div>
  </AdminPage>;
}

function documentRef(dataUrl: string, fileName: string) { const anchor = document.createElement('a'); anchor.href = dataUrl; anchor.download = fileName; document.body.appendChild(anchor); return anchor; }
function statusLabel(value: string) { const labels: Record<string,string> = { DRAFT:'รอเอกสาร', SUBMITTED:'ส่งตรวจแล้ว', REVIEWING:'กำลังตรวจ', APPROVED:'อนุมัติแล้ว', REJECTED:'ไม่ผ่าน', EXPIRED:'หมดอายุ', UPLOADED:'อัปโหลดแล้ว', ACCEPTED:'ผ่าน' }; return labels[value] ?? value; }
function documentLabel(value: string) { const labels: Record<string,string> = { NATIONAL_ID_FRONT:'บัตรประชาชนหน้า', NATIONAL_ID_BACK:'บัตรประชาชนหลัง', PASSPORT:'Passport', SELFIE:'Selfie', ADDRESS_PROOF:'หลักฐานที่อยู่', BANK_PROOF:'หลักฐานธนาคาร', OTHER:'อื่น ๆ' }; return labels[value] ?? value; }
function statusTone(value: string): 'neutral' | 'success' | 'warning' | 'danger' { if (['APPROVED','ACCEPTED'].includes(value)) return 'success'; if (['REJECTED','EXPIRED'].includes(value)) return 'danger'; if (['SUBMITTED','REVIEWING'].includes(value)) return 'warning'; return 'neutral'; }
function formatDate(value?: string | null) { if (!value) return '-'; const date = new Date(value); return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('th-TH'); }
function formatBytes(value: number) { return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.max(Math.round(value / 1024), 1)} KB`; }
function Summary({ label, value }: { label: string; value: string }) { return <div style={summaryStyle}><span>{label}</span><strong>{value}</strong></div>; }
const layoutStyle = { display:'grid', gridTemplateColumns:'minmax(320px,.9fr) minmax(420px,1.3fr)', gap:18, alignItems:'start' } as const;
const bodyStyle = { display:'grid', gap:6, minWidth:0 };
const badgeRowStyle = { display:'flex', gap:8, flexWrap:'wrap' as const };
const mutedStyle = { color:'#94a3b8', fontSize:13, overflowWrap:'anywhere' as const };
const noteStyle = { color:'#fbbf24', fontSize:13 };
const summaryGridStyle = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10 };
const summaryStyle = { display:'grid', gap:5, padding:12, border:'1px solid rgba(148,163,184,.16)', borderRadius:12 };
const fieldStyle = { display:'grid', gap:8, minWidth:180, fontSize:13 };
const inputStyle = { width:'100%', border:'1px solid rgba(148,163,184,.25)', borderRadius:10, padding:'10px 12px', background:'rgba(15,23,42,.65)', color:'inherit' };
const actionRowStyle = { display:'flex', gap:8, flexWrap:'wrap' as const };
const documentListStyle = { display:'grid', gap:10 };
const documentStyle = { display:'grid', gap:12, padding:14, border:'1px solid rgba(148,163,184,.16)', borderRadius:14 };
