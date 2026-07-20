'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminApiFetch } from '../../../admin-api';
import { AdminActionStrip, AdminBadge, AdminButton, AdminCard, AdminCode, AdminDataValue, AdminEmpty, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../../_components/admin-ui';
import { RiskMetadataRaw, RiskMetadataView } from '../metadata';
import { RiskRelatedLinks } from '../related-links';

type AdminOption = { id: string; username: string; email: string };
type RiskNote = { id: string; note: string; createdAt: string; adminUser?: AdminOption | null };
type RiskAlert = { id: string; type: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; status: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED'; memberId?: string | null; shortMemberId?: string | null; refType?: string | null; refId?: string | null; title: string; description?: string | null; metadata?: Record<string, unknown> | null; createdAt: string; updatedAt?: string; resolvedAt?: string | null; resolvedBy?: string | null; assignedToAdminId?: string | null; assignedAt?: string | null; assignedToAdmin?: AdminOption | null; notes?: RiskNote[] };
type ChecklistTone = 'neutral' | 'success' | 'warning' | 'danger';

export default function RiskAlertDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [item, setItem] = useState<RiskAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [assignees, setAssignees] = useState<AdminOption[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (id) { void load(); void loadAssignees(); } }, [id]);
  const checklist = useMemo(() => item ? buildChecklist(item) : [], [item]);

  async function load() {
    setLoading(true);
    const res = await adminApiFetch(`/admin/risk-alerts/${id}`);
    const data = await res.json().catch(() => null);
    if (res.ok) { setItem(data?.item ?? null); setMessage(''); } else setMessage(data?.message ?? 'โหลดรายการความเสี่ยงไม่สำเร็จ');
    setLoading(false);
  }

  async function updateStatus(nextStatus: RiskAlert['status']) {
    const res = await adminApiFetch(`/admin/risk-alerts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
    const data = await res.json().catch(() => null);
    if (!res.ok) setMessage(data?.message ?? 'อัปเดตสถานะไม่สำเร็จ'); else setMessage('อัปเดตสถานะแล้ว');
    await load();
  }

  async function loadAssignees() {
    const res = await adminApiFetch('/admin/risk-alerts/assignees/list');
    const data = await res.json().catch(() => null);
    if (res.ok) setAssignees(data?.items ?? []);
  }

  async function assign(adminUserId: string) {
    setSaving(true);
    const res = await adminApiFetch(`/admin/risk-alerts/${id}/assignment`, { method: 'PATCH', body: JSON.stringify({ adminUserId: adminUserId || null }) });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) setMessage(data?.message ?? 'มอบหมายงานไม่สำเร็จ'); else { setMessage('บันทึกผู้รับผิดชอบแล้ว'); await load(); }
  }

  async function addNote() {
    if (!note.trim() || saving) return;
    setSaving(true);
    const res = await adminApiFetch(`/admin/risk-alerts/${id}/notes`, { method: 'POST', body: JSON.stringify({ note: note.trim() }) });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) setMessage(data?.message ?? 'เพิ่มหมายเหตุไม่สำเร็จ'); else { setNote(''); setMessage('เพิ่มหมายเหตุแล้ว'); await load(); }
  }

  return <AdminPage eyebrow="งานตรวจสอบความเสี่ยง" title="รายละเอียดรายการความเสี่ยง" description="ตรวจข้อมูลที่เกี่ยวข้อง มอบหมายผู้รับผิดชอบ บันทึกผล และปิดเคสอย่างมีหลักฐาน" actions={<><AdminLinkButton href="/risk-alerts">กลับรายการ</AdminLinkButton><AdminButton tone="secondary" onClick={load} disabled={loading}>รีเฟรช</AdminButton></>}>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    {loading && !item && <AdminEmpty>กำลังโหลดรายการความเสี่ยง...</AdminEmpty>}
    {item && <>
      <AdminMetricGrid>
        <AdminMetric title="ระดับความเสี่ยง" value={severityLabel(item.severity)} helper={item.type} tone={severityTone(item.severity)} />
        <AdminMetric title="สถานะ" value={statusLabel(item.status)} helper={item.resolvedAt ? `ปิดเมื่อ ${new Date(item.resolvedAt).toLocaleString('th-TH')}` : 'อยู่ระหว่างดำเนินการ'} tone={statusTone(item.status)} />
        <AdminMetric title="สร้างเมื่อ" value={new Date(item.createdAt).toLocaleDateString('th-TH')} helper={new Date(item.createdAt).toLocaleTimeString('th-TH')} />
        <AdminMetric title="ข้อมูลอ้างอิง" value={item.refType ?? '-'} helper={item.refId ? shortId(item.refId) : '-'} />
      </AdminMetricGrid>

      <AdminCard title={item.title} description={item.description ?? 'ไม่มีคำอธิบายเพิ่มเติม'}>
        <AdminStack>
          <AdminDataValue label="ระดับความเสี่ยง"><AdminBadge tone={severityTone(item.severity)}>{severityLabel(item.severity)}</AdminBadge></AdminDataValue>
          <AdminDataValue label="สถานะ"><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge></AdminDataValue>
          <AdminDataValue label="ประเภท">{item.type}</AdminDataValue>
          <AdminDataValue label="สมาชิก">{item.memberId ? <AdminLinkButton href={`/members/${item.memberId}`} size="compact">{item.shortMemberId ?? shortId(item.memberId)}</AdminLinkButton> : '-'}</AdminDataValue>
          <AdminDataValue label="ข้อมูลอ้างอิง"><AdminCode title={item.refId ?? undefined}>{item.refType ?? '-'} / {item.refId ?? '-'}</AdminCode></AdminDataValue>
          <AdminDataValue label="แก้ไขล่าสุด">{item.updatedAt ? new Date(item.updatedAt).toLocaleString('th-TH') : '-'}</AdminDataValue>
          <AdminDataValue label="ผู้ปิดรายการ"><AdminCode title={item.resolvedBy ?? undefined}>{item.resolvedBy ?? '-'}</AdminCode></AdminDataValue>
        </AdminStack>
      </AdminCard>

      <AdminGrid>
        <AdminCard title="ดำเนินการกับสถานะ" description="เปลี่ยนสถานะหลังตรวจสอบข้อมูลและบันทึกเหตุผลแล้ว">
          <AdminActionStrip><AdminButton tone="secondary" disabled={item.status === 'REVIEWING'} onClick={() => updateStatus('REVIEWING')}>เริ่มตรวจสอบ</AdminButton><AdminButton tone="success" disabled={item.status === 'RESOLVED'} onClick={() => updateStatus('RESOLVED')}>ยืนยันและปิดเคส</AdminButton><AdminButton tone="danger" disabled={item.status === 'DISMISSED'} onClick={() => updateStatus('DISMISSED')}>ยกเลิกรายการเตือน</AdminButton></AdminActionStrip>
        </AdminCard>
        <AdminCard title="ข้อมูลที่เกี่ยวข้อง" description="ทางลัดไปยังสมาชิก รายการเงิน และข้อมูลอ้างอิง"><RiskRelatedLinks item={item} /></AdminCard>
      </AdminGrid>

      <AdminGrid>
        <AdminCard title="ผู้รับผิดชอบ" description="กำหนดเจ้าของเคสเพื่อป้องกันรายการตกหล่น">
          <select value={item.assignedToAdminId ?? ''} onChange={(event) => void assign(event.target.value)} disabled={saving} style={selectStyle}><option value="">ยังไม่ได้มอบหมาย</option>{assignees.map((admin) => <option key={admin.id} value={admin.id}>{admin.username} · {admin.email}</option>)}</select>
          {item.assignedAt && <p style={mutedStyle}>มอบหมายเมื่อ {new Date(item.assignedAt).toLocaleString('th-TH')}</p>}
        </AdminCard>
        <AdminCard title="เพิ่มหมายเหตุ" description="บันทึกเหตุผล ผลการตรวจสอบ และหลักฐานประกอบ">
          <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} placeholder="เขียนหมายเหตุการตรวจสอบ..." style={textareaStyle} />
          <AdminButton onClick={() => void addNote()} disabled={saving || !note.trim()}>{saving ? 'กำลังบันทึก...' : 'บันทึกหมายเหตุ'}</AdminButton>
        </AdminCard>
      </AdminGrid>

      <AdminCard title="รายการตรวจสอบก่อนปิดเคส" description="ตรวจข้อมูลหลักให้ครบก่อนยืนยันหรือยกเลิกรายการเตือน">
        <AdminStack>{checklist.map((row) => <AdminRow key={row.label}><div><strong>{row.label}</strong><p style={mutedStyle}>{row.description}</p></div><AdminBadge tone={row.tone}>{row.status}</AdminBadge></AdminRow>)}</AdminStack>
      </AdminCard>

      <AdminCard title="ลำดับเหตุการณ์" description="เหตุการณ์หลักและหมายเหตุการตรวจสอบ">
        <AdminStack><AdminDataValue label="สร้างรายการ">{new Date(item.createdAt).toLocaleString('th-TH')}</AdminDataValue>{item.updatedAt && <AdminDataValue label="แก้ไขล่าสุด">{new Date(item.updatedAt).toLocaleString('th-TH')}</AdminDataValue>}{item.resolvedAt && <AdminDataValue label="ปิดรายการ">{new Date(item.resolvedAt).toLocaleString('th-TH')}</AdminDataValue>}{(item.notes ?? []).map((entry) => <AdminRow key={entry.id}><div><strong>{entry.adminUser?.username ?? 'ผู้ดูแล'}</strong><p style={mutedStyle}>{entry.note}</p></div><span>{new Date(entry.createdAt).toLocaleString('th-TH')}</span></AdminRow>)}</AdminStack>
      </AdminCard>

      <AdminCard title="ข้อมูลทางเทคนิค" description="สรุปข้อมูลจากกฎตรวจจับ พร้อมค่าดิบสำหรับตรวจสอบ"><RiskMetadataView metadata={item.metadata ?? null} /><RiskMetadataRaw metadata={item.metadata ?? null} /></AdminCard>
    </>}
  </AdminPage>;
}

function buildChecklist(item: RiskAlert) {
  const metadata = item.metadata ?? {};
  return [
    { label: 'ตรวจข้อมูลอ้างอิง', description: item.refId ? `${item.refType}/${item.refId}` : 'ไม่มีข้อมูลอ้างอิง ต้องตรวจข้อมูลทางเทคนิคแทน', status: item.refId ? 'พร้อมตรวจ' : 'ต้องตรวจเพิ่ม', tone: item.refId ? 'success' : 'warning' },
    { label: 'ตรวจสมาชิก', description: item.memberId ? `สมาชิกรหัส ${item.memberId}` : 'ไม่มีรหัสสมาชิกในรายการเตือน', status: item.memberId ? 'พร้อมตรวจ' : 'ต้องตรวจเพิ่ม', tone: item.memberId ? 'success' : 'warning' },
    { label: 'ตรวจข้อมูลทางเทคนิค', description: Object.keys(metadata).length ? 'มีข้อมูลสำหรับตรวจสอบต่อ' : 'ไม่มีข้อมูลทางเทคนิคเพิ่มเติม', status: Object.keys(metadata).length ? 'พร้อมตรวจ' : 'ข้อมูลไม่ครบ', tone: Object.keys(metadata).length ? 'success' : 'danger' },
    { label: 'ประเมินความเสี่ยง', description: item.severity === 'HIGH' || item.severity === 'CRITICAL' ? 'ต้องตรวจข้อมูลที่เกี่ยวข้องก่อนปิดเคส' : 'ยกเลิกรายการเตือนได้เมื่อยืนยันว่าไม่พบความเสี่ยง', status: severityLabel(item.severity), tone: severityTone(item.severity) },
  ] as Array<{ label: string; description: string; status: string; tone: ChecklistTone }>;
}

function severityTone(value: RiskAlert['severity']): ChecklistTone { if (value === 'CRITICAL' || value === 'HIGH') return 'danger'; if (value === 'MEDIUM') return 'warning'; return 'neutral'; }
function statusTone(value: RiskAlert['status']): ChecklistTone { if (value === 'RESOLVED') return 'success'; if (value === 'REVIEWING') return 'warning'; if (value === 'DISMISSED') return 'neutral'; return 'danger'; }
function severityLabel(value: RiskAlert['severity']) { return ({ LOW: 'ต่ำ', MEDIUM: 'ปานกลาง', HIGH: 'สูง', CRITICAL: 'วิกฤต' } as const)[value]; }
function statusLabel(value: RiskAlert['status']) { return ({ OPEN: 'เปิดอยู่', REVIEWING: 'กำลังตรวจสอบ', RESOLVED: 'ปิดแล้ว', DISMISSED: 'ยกเลิกการเตือน' } as const)[value]; }
function shortId(value: string) { return value.length > 20 ? `${value.slice(0, 11)}…${value.slice(-6)}` : value; }

const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const selectStyle = { minHeight: 44, width: '100%', borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', fontSize: 16, boxSizing: 'border-box' as const };
const textareaStyle = { width: '100%', minHeight: 110, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: 12, fontSize: 16, boxSizing: 'border-box' as const, marginBottom: 10 };
