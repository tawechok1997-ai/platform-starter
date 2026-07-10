'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminApiFetch } from '../../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../../_components/admin-ui';
import { RiskMetadataRaw, RiskMetadataView } from '../metadata';
import { RiskRelatedLinks } from '../related-links';

type RiskAlert = { id: string; type: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; status: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED'; memberId?: string | null; shortMemberId?: string | null; refType?: string | null; refId?: string | null; title: string; description?: string | null; metadata?: Record<string, unknown> | null; createdAt: string; updatedAt?: string; resolvedAt?: string | null; resolvedBy?: string | null };

export default function RiskAlertDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [item, setItem] = useState<RiskAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  useEffect(() => { if (id) load(); }, [id]);
  const checklist = useMemo(() => item ? buildChecklist(item) : [], [item]);
  async function load() { setLoading(true); const res = await adminApiFetch(`/admin/risk-alerts/${id}`); const data = await res.json().catch(() => null); if (res.ok) { setItem(data?.item ?? null); setMessage(''); } else setMessage(data?.message ?? 'โหลด Risk Alert ไม่สำเร็จ'); setLoading(false); }
  async function updateStatus(nextStatus: RiskAlert['status']) { const res = await adminApiFetch(`/admin/risk-alerts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) }); const data = await res.json().catch(() => null); if (!res.ok) setMessage(data?.message ?? 'อัปเดตสถานะไม่สำเร็จ'); else setMessage('อัปเดตสถานะแล้ว'); await load(); }
  return <AdminPage eyebrow="Risk Operation" title="Risk Alert Detail" description="รายละเอียด alert, checklist, related links และ workflow สำหรับตรวจสอบ/ปิดเคส" actions={<><AdminLinkButton href="/risk-alerts">Back</AdminLinkButton><AdminButton tone="secondary" onClick={load}>Reload</AdminButton></>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    {loading && !item && <AdminEmpty>กำลังโหลด alert...</AdminEmpty>}
    {item && <>
      <AdminMetricGrid><AdminMetric title="Severity" value={item.severity} helper={item.type} /><AdminMetric title="Status" value={item.status} helper={item.resolvedAt ? `Resolved ${new Date(item.resolvedAt).toLocaleString('th-TH')}` : 'Active workflow'} /><AdminMetric title="Created" value={new Date(item.createdAt).toLocaleDateString('th-TH')} helper={new Date(item.createdAt).toLocaleTimeString('th-TH')} /><AdminMetric title="Reference" value={item.refType ?? '-'} helper={item.refId ? item.refId.slice(0, 12) : '-'} /></AdminMetricGrid>
      <AdminCard title={item.title} description={item.description ?? 'ไม่มีคำอธิบายเพิ่มเติม'}><AdminStack><AdminRow><strong>Severity</strong><AdminBadge tone={severityTone(item.severity)}>{item.severity}</AdminBadge></AdminRow><AdminRow><strong>Status</strong><AdminBadge tone={statusTone(item.status)}>{item.status}</AdminBadge></AdminRow><AdminRow><strong>Type</strong><span>{item.type}</span></AdminRow><AdminRow><strong>Member</strong>{item.memberId ? <AdminLinkButton href={`/members/${item.memberId}`}>{item.shortMemberId ?? item.memberId.slice(0, 8)}</AdminLinkButton> : <span>-</span>}</AdminRow><AdminRow><strong>Reference</strong><span style={monoStyle}>{item.refType ?? '-'} / {item.refId ?? '-'}</span></AdminRow><AdminRow><strong>Updated</strong><span>{item.updatedAt ? new Date(item.updatedAt).toLocaleString('th-TH') : '-'}</span></AdminRow><AdminRow><strong>Resolved By</strong><span style={monoStyle}>{item.resolvedBy ?? '-'}</span></AdminRow></AdminStack></AdminCard>
      <AdminGrid><AdminCard title="Workflow Actions" description="เปลี่ยนสถานะหลังตรวจสอบแล้ว อย่าปิด HIGH/CRITICAL เพียงเพราะอยากให้หน้าดูสะอาด"><div style={actionStyle}><AdminButton tone="secondary" disabled={item.status === 'REVIEWING'} onClick={() => updateStatus('REVIEWING')}>Reviewing</AdminButton><AdminButton tone="success" disabled={item.status === 'RESOLVED'} onClick={() => updateStatus('RESOLVED')}>Resolve</AdminButton><AdminButton tone="danger" disabled={item.status === 'DISMISSED'} onClick={() => updateStatus('DISMISSED')}>Dismiss</AdminButton></div></AdminCard><AdminCard title="Related links" description="ทางลัดไปข้อมูลที่เกี่ยวข้อง"><RiskRelatedLinks item={item} /></AdminCard></AdminGrid>
      <AdminCard title="Investigation Checklist" description="เช็กลิสต์ก่อนปิดเคส"><AdminStack>{checklist.map((row) => <AdminRow key={row.label}><div><strong>{row.label}</strong><p style={mutedStyle}>{row.description}</p></div><AdminBadge tone={row.tone}>{row.status}</AdminBadge></AdminRow>)}</AdminStack></AdminCard>
      <AdminCard title="Timeline" description="เหตุการณ์หลักของ alert"><AdminStack><AdminRow><strong>Created</strong><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></AdminRow>{item.updatedAt && <AdminRow><strong>Updated</strong><span>{new Date(item.updatedAt).toLocaleString('th-TH')}</span></AdminRow>}{item.resolvedAt && <AdminRow><strong>Resolved</strong><span>{new Date(item.resolvedAt).toLocaleString('th-TH')}</span></AdminRow>}</AdminStack></AdminCard>
      <AdminCard title="Metadata" description="สรุปข้อมูลจาก rule แบบอ่านง่าย"><RiskMetadataView metadata={item.metadata} /><RiskMetadataRaw metadata={item.metadata} /></AdminCard>
    </>}
  </AdminPage>;
}
function buildChecklist(item: RiskAlert) { const metadata = item.metadata ?? {}; return [{ label: 'ตรวจ reference', description: item.refId ? `${item.refType}/${item.refId}` : 'ไม่มี reference ต้องตรวจ metadata แทน', status: item.refId ? 'Ready' : 'Check', tone: item.refId ? 'success' : 'warning' }, { label: 'ตรวจสมาชิก', description: item.memberId ? `member ${item.memberId}` : 'ไม่มี memberId ใน alert', status: item.memberId ? 'Ready' : 'Check', tone: item.memberId ? 'success' : 'warning' }, { label: 'ตรวจ metadata', description: Object.keys(metadata).length ? 'มี metadata สำหรับสืบต่อ' : 'ไม่มี metadata เพิ่มเติม', status: Object.keys(metadata).length ? 'Ready' : 'Missing', tone: Object.keys(metadata).length ? 'success' : 'danger' }, { label: 'ความเสี่ยงสูง', description: item.severity === 'HIGH' || item.severity === 'CRITICAL' ? 'ต้องตรวจ related data ก่อนปิด' : 'สามารถ dismiss ได้ถ้าตรวจแล้ว false positive', status: item.severity, tone: severityTone(item.severity) }] as Array<{ label: string; description: string; status: string; tone: any }>; }
function severityTone(value: RiskAlert['severity']) { if (value === 'CRITICAL' || value === 'HIGH') return 'danger'; if (value === 'MEDIUM') return 'warning'; return 'neutral'; }
function statusTone(value: RiskAlert['status']) { if (value === 'RESOLVED') return 'success'; if (value === 'REVIEWING') return 'warning'; if (value === 'DISMISSED') return 'neutral'; return 'danger'; }
const actionStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const };
const mutedStyle = { margin: 0, color: '#94a3b8', lineHeight: 1.55 } as const;
const monoStyle = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', overflowWrap: 'anywhere' as const, color: '#cbd5e1' } as const;
