'use client';

import { AdminButton, AdminCard, AdminGrid, AdminNotice, AdminPage } from '../_components/admin-ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function ExportsPage() {
  function download(path: string) {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { alert('กรุณา login admin ก่อน'); return; }
    fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? 'Export ไม่สำเร็จ');
        return res.text();
      })
      .then((text) => {
        const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = path.split('/').pop() ?? 'export.csv';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((error) => alert(error.message));
  }

  return (
    <AdminPage eyebrow="Finance Export" title="Exports" description="ดาวน์โหลดข้อมูลการเงินเป็น CSV สำหรับตรวจสอบและทำบัญชี">
      <AdminGrid>
        <ExportCard title="Top-ups CSV" text="รายการเติมเงินทั้งหมด" onClick={() => download('/admin/exports/topups.csv')} />
        <ExportCard title="Withdrawals CSV" text="รายการถอนเงินทั้งหมด" onClick={() => download('/admin/exports/withdrawals.csv')} />
        <ExportCard title="Ledgers CSV" text="ประวัติ ledger ยอดก่อน/หลัง" onClick={() => download('/admin/exports/ledgers.csv')} />
      </AdminGrid>
      <AdminNotice>ไฟล์ CSV จะถูกดาวน์โหลดจาก API โดยใช้ admin token ปัจจุบัน</AdminNotice>
    </AdminPage>
  );
}

function ExportCard({ title, text, onClick }: { title: string; text: string; onClick: () => void }) {
  return <AdminCard title={title} description={text}><AdminButton onClick={onClick}>Download</AdminButton></AdminCard>;
}
