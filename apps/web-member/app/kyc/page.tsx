'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { MemberButton, MemberCard, MemberEmptyState, MemberNotice } from '../components/member-ui';
import { memberApiFetch } from '../member-api';

const DOCUMENT_TYPES = [
  ['NATIONAL_ID_FRONT', 'บัตรประชาชนด้านหน้า'],
  ['NATIONAL_ID_BACK', 'บัตรประชาชนด้านหลัง'],
  ['PASSPORT', 'หนังสือเดินทาง'],
  ['SELFIE', 'ภาพเซลฟี่ถือเอกสาร'],
  ['ADDRESS_PROOF', 'หลักฐานที่อยู่'],
  ['BANK_PROOF', 'หลักฐานบัญชีธนาคาร'],
  ['OTHER', 'เอกสารอื่น'],
] as const;

type DocumentType = typeof DOCUMENT_TYPES[number][0];
type KycDocument = { id: string; documentType: string; status: string; originalName: string; mimeType: string; sizeBytes: number; retentionUntil: string; version: number; reviewNote?: string | null };
type KycCase = { id: string; status: string; riskLevel: string; submittedAt?: string | null; reviewedAt?: string | null; reviewNote?: string | null; version: number };
type KycResponse = { item: KycCase | null; documents: KycDocument[] };

export default function MemberKycPage() {
  const [payload, setPayload] = useState<KycResponse>({ item: null, documents: [] });
  const [documentType, setDocumentType] = useState<DocumentType>('NATIONAL_ID_FRONT');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true); setError('');
    try {
      const response = await memberApiFetch('/member/kyc');
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? 'โหลดสถานะ KYC ไม่สำเร็จ');
      setPayload({ item: data?.item ?? null, documents: Array.isArray(data?.documents) ? data.documents : [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'โหลดสถานะ KYC ไม่สำเร็จ');
    } finally { setLoading(false); }
  }

  async function upload() {
    if (!file) { setError('กรุณาเลือกไฟล์ก่อนอัปโหลด'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const dataUrl = await toDataUrl(file);
      const response = await memberApiFetch('/member/kyc/documents', {
        method: 'POST',
        body: JSON.stringify({ documentType, originalName: file.name, dataUrl }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? 'อัปโหลดเอกสารไม่สำเร็จ');
      setMessage('อัปโหลดเอกสารแล้ว');
      setFile(null);
      const input = document.getElementById('kyc-file') as HTMLInputElement | null;
      if (input) input.value = '';
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อัปโหลดเอกสารไม่สำเร็จ');
    } finally { setBusy(false); }
  }

  async function submit() {
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await memberApiFetch('/member/kyc/submit', { method: 'POST' });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? 'ส่งคำขอตรวจ KYC ไม่สำเร็จ');
      setMessage('ส่งคำขอตรวจ KYC แล้ว');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ส่งคำขอตรวจ KYC ไม่สำเร็จ');
    } finally { setBusy(false); }
  }

  const uploadedTypes = useMemo(() => new Set(payload.documents.map((item) => item.documentType)), [payload.documents]);
  const hasIdentity = uploadedTypes.has('PASSPORT') || (uploadedTypes.has('NATIONAL_ID_FRONT') && uploadedTypes.has('NATIONAL_ID_BACK'));
  const canSubmit = payload.item?.status === 'DRAFT' && hasIdentity && uploadedTypes.has('SELFIE');
  const acceptingUploads = !payload.item || payload.item.status === 'DRAFT';

  return <main className="member-feature-page">
    <div className="member-feature-container">
      <header className="member-feature-header">
        <div><p>ยืนยันตัวตน</p><h1>KYC และเอกสารสมาชิก</h1><span>อัปโหลดเอกสารผ่านพื้นที่ส่วนตัวและติดตามผลการตรวจได้จากหน้านี้</span></div>
        <MemberButton onClick={() => void load()} disabled={loading || busy}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</MemberButton>
      </header>

      {error && <MemberNotice tone="danger"><strong>{error}</strong></MemberNotice>}
      {message && <MemberNotice tone="success"><strong>{message}</strong></MemberNotice>}

      <MemberCard>
        <div style={headingStyle}><div><p style={eyebrowStyle}>สถานะปัจจุบัน</p><h2 style={titleStyle}>{statusLabel(payload.item?.status ?? 'DRAFT')}</h2></div><span style={statusPill(payload.item?.status)}>{payload.item?.riskLevel ?? 'NORMAL'}</span></div>
        <p style={mutedStyle}>{payload.item?.reviewNote || 'ระบบยังไม่มีหมายเหตุจากผู้ตรวจ'}</p>
        <div style={summaryGridStyle}>
          <Summary label="เอกสารทั้งหมด" value={String(payload.documents.length)} />
          <Summary label="เอกสารยืนยันตัวตน" value={hasIdentity ? 'ครบ' : 'ยังไม่ครบ'} />
          <Summary label="เซลฟี่" value={uploadedTypes.has('SELFIE') ? 'ครบ' : 'ยังไม่ครบ'} />
          <Summary label="เวอร์ชันเคส" value={String(payload.item?.version ?? 1)} />
        </div>
      </MemberCard>

      {acceptingUploads && <MemberCard>
        <div style={headingStyle}><div><p style={eyebrowStyle}>อัปโหลดเอกสาร</p><h2 style={titleStyle}>เพิ่มเอกสารใหม่</h2></div></div>
        <div style={formGridStyle}>
          <label style={fieldStyle}>ประเภทเอกสาร<select value={documentType} onChange={(event) => setDocumentType(event.target.value as DocumentType)} style={inputStyle}>{DOCUMENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label style={fieldStyle}>ไฟล์<input id="kyc-file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)} style={inputStyle} /></label>
        </div>
        <p style={mutedStyle}>รองรับ JPEG, PNG, WebP และ PDF ขนาดไม่เกิน 10 MB</p>
        <MemberButton onClick={() => void upload()} disabled={busy || !file}>{busy ? 'กำลังดำเนินการ...' : 'อัปโหลดเอกสาร'}</MemberButton>
      </MemberCard>}

      <MemberCard>
        <div style={headingStyle}><div><p style={eyebrowStyle}>รายการเอกสาร</p><h2 style={titleStyle}>เอกสารที่ส่งแล้ว</h2></div></div>
        {loading ? <MemberEmptyState compact title="กำลังโหลด" description="ระบบกำลังอ่านรายการเอกสาร" /> : payload.documents.length === 0 ? <MemberEmptyState compact title="ยังไม่มีเอกสาร" description="เพิ่มเอกสารยืนยันตัวตนและภาพเซลฟี่เพื่อเริ่มตรวจ KYC" /> : <div style={listStyle}>{payload.documents.map((item) => <article key={item.id} style={rowStyle}>
          <div><strong>{documentLabel(item.documentType)}</strong><div style={mutedStyle}>{item.originalName} · {formatBytes(item.sizeBytes)}</div>{item.reviewNote && <div style={noteStyle}>{item.reviewNote}</div>}</div>
          <span style={statusPill(item.status)}>{statusLabel(item.status)}</span>
        </article>)}</div>}
      </MemberCard>

      {payload.item?.status === 'DRAFT' && <MemberCard tone={canSubmit ? 'success' : 'warning'}>
        <div style={headingStyle}><div><p style={eyebrowStyle}>ส่งตรวจ</p><h2 style={titleStyle}>ยืนยันส่งคำขอ KYC</h2></div></div>
        <p style={mutedStyle}>{canSubmit ? 'เอกสารขั้นต่ำครบแล้ว ระบบจะล็อกการอัปโหลดหลังส่งตรวจ' : 'ต้องมี Passport หรือบัตรประชาชนหน้าและหลัง พร้อมภาพเซลฟี่ก่อนส่งตรวจ'}</p>
        <MemberButton tone="success" onClick={() => void submit()} disabled={!canSubmit || busy}>{busy ? 'กำลังส่ง...' : 'ส่งคำขอตรวจ'}</MemberButton>
      </MemberCard>}
    </div>
  </main>;
}

function toDataUrl(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ')); reader.readAsDataURL(file); }); }
function documentLabel(value: string) { return DOCUMENT_TYPES.find(([type]) => type === value)?.[1] ?? value; }
function statusLabel(value: string) { const labels: Record<string,string> = { DRAFT:'รออัปโหลดเอกสาร', SUBMITTED:'ส่งตรวจแล้ว', REVIEWING:'กำลังตรวจ', APPROVED:'อนุมัติแล้ว', REJECTED:'ไม่ผ่าน', EXPIRED:'หมดอายุ', UPLOADED:'อัปโหลดแล้ว', ACCEPTED:'ผ่าน', DELETED:'ลบแล้ว' }; return labels[value] ?? value; }
function formatBytes(value: number) { return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.max(Math.round(value / 1024), 1)} KB`; }
function Summary({ label, value }: { label: string; value: string }) { return <div style={summaryStyle}><span>{label}</span><strong>{value}</strong></div>; }
const headingStyle = { display:'flex', justifyContent:'space-between', gap:16, alignItems:'flex-start', marginBottom:16 } as const;
const eyebrowStyle = { margin:0, color:'#94a3b8', fontSize:12, textTransform:'uppercase' as const, letterSpacing:'.08em' };
const titleStyle = { margin:'4px 0 0', fontSize:22 };
const mutedStyle = { color:'#94a3b8', fontSize:14, lineHeight:1.6 };
const summaryGridStyle = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginTop:18 };
const summaryStyle = { display:'grid', gap:6, padding:14, border:'1px solid rgba(148,163,184,.18)', borderRadius:14 };
const formGridStyle = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14, marginBottom:12 };
const fieldStyle = { display:'grid', gap:8, fontSize:13, color:'#cbd5e1' };
const inputStyle = { width:'100%', minHeight:44, borderRadius:12, border:'1px solid rgba(148,163,184,.25)', background:'rgba(15,23,42,.65)', color:'inherit', padding:'10px 12px' };
const listStyle = { display:'grid', gap:10 };
const rowStyle = { display:'flex', justifyContent:'space-between', gap:16, alignItems:'center', padding:14, border:'1px solid rgba(148,163,184,.16)', borderRadius:14, flexWrap:'wrap' as const };
const noteStyle = { marginTop:6, color:'#fbbf24', fontSize:13 };
function statusPill(value?: string) { const danger = ['REJECTED','EXPIRED'].includes(value ?? ''); const success = ['APPROVED','ACCEPTED','VERIFIED'].includes(value ?? ''); return { borderRadius:999, padding:'6px 10px', fontSize:12, fontWeight:700, background: danger ? 'rgba(239,68,68,.14)' : success ? 'rgba(34,197,94,.14)' : 'rgba(59,130,246,.14)', color: danger ? '#fca5a5' : success ? '#86efac' : '#93c5fd' }; }
