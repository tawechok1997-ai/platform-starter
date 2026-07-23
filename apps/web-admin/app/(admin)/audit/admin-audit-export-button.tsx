'use client';

import { useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { ADMIN_ACTION_PERMISSIONS } from '../_components/admin-permission-contract';
import { AdminPermissionGate } from '../_components/admin-permissions';
import { AdminButton } from '../_components/admin-ui';

type AuditExportFilters = {
  search: string;
  module: string;
  action: string;
  admin: string;
  targetId: string;
  from: string;
  to: string;
};

type ExportPayload = {
  filename?: string;
  contentType?: string;
  rowCount?: number;
  truncated?: boolean;
  content?: string;
  message?: string;
};

export function AdminAuditExportButton({ filters, disabled = false, onMessage }: { filters: AuditExportFilters; disabled?: boolean | undefined; onMessage: (message: string, error?: boolean) => void }) {
  const [exporting, setExporting] = useState(false);

  async function exportAudit() {
    setExporting(true);
    onMessage('กำลังเตรียมไฟล์ Audit...');
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => { if (value.trim()) params.set(key, value.trim()); });
      const response = await adminApiFetch(`/admin/audit-logs/export${params.size > 0 ? `?${params.toString()}` : ''}`);
      const payload = await response.json().catch(() => null) as ExportPayload | null;
      if (!response.ok || typeof payload?.content !== 'string') {
        onMessage(payload?.message ?? 'ส่งออก Audit ไม่สำเร็จ กรุณาลองใหม่', true);
        return;
      }

      const blob = new Blob([payload.content], { type: payload.contentType ?? 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = payload.filename ?? `admin-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      const rows = Number(payload.rowCount ?? 0).toLocaleString('th-TH');
      onMessage(payload.truncated ? `ส่งออก ${rows} แถวแล้ว ไฟล์ถึงเพดานการส่งออก` : `ส่งออก ${rows} แถวแล้ว`);
    } catch {
      onMessage('ส่งออก Audit ไม่สำเร็จ กรุณาลองใหม่', true);
    } finally {
      setExporting(false);
    }
  }

  return <AdminPermissionGate anyOf={ADMIN_ACTION_PERMISSIONS.auditExport}>
    <AdminButton tone="secondary" disabled={disabled || exporting} onClick={() => void exportAudit()}>{exporting ? 'กำลังส่งออก...' : 'ส่งออก CSV'}</AdminButton>
  </AdminPermissionGate>;
}
