export type Tone = 'success' | 'warning' | 'danger' | 'neutral';

export function humanStatus(status?: string | null) {
  const map: Record<string, string> = {
    ACTIVE: 'พร้อมใช้', INACTIVE: 'ปิดอยู่', MAINTENANCE: 'ปิดปรับปรุง', DEGRADED: 'มีปัญหาบางส่วน',
    SUCCESS: 'สำเร็จ', FAILED: 'มีปัญหา', PENDING: 'กำลังทำ', REVERSED: 'คืนแล้ว', CANCELLED: 'ยกเลิก',
    OPEN: 'ต้องตรวจ', REVIEWING: 'กำลังตรวจ', RESOLVED: 'แก้แล้ว', DISMISSED: 'ปิดแล้ว',
    MATCHED: 'ยอดตรง', MISMATCH: 'ยอดไม่ตรง', UNKNOWN: 'ยังไม่รู้ผล',
    RECEIVED: 'รับแล้ว', PROCESSED: 'ทำแล้ว', DUPLICATE: 'ซ้ำ', IGNORED: 'ข้ามแล้ว',
  };
  return status ? map[status] ?? status : '-';
}

export function statusTone(status?: string | null): Tone {
  if (!status) return 'neutral';
  if (['ACTIVE', 'SUCCESS', 'RESOLVED', 'MATCHED', 'PROCESSED'].includes(status)) return 'success';
  if (['PENDING', 'REVIEWING', 'RECEIVED', 'UNKNOWN', 'MAINTENANCE', 'DEGRADED'].includes(status)) return 'warning';
  if (['FAILED', 'OPEN', 'MISMATCH', 'CRITICAL', 'HIGH'].includes(status)) return 'danger';
  return 'neutral';
}

export function transferLabel(type?: string | null) {
  const map: Record<string, string> = { TRANSFER_IN: 'โยกเข้าเกม', TRANSFER_OUT: 'โยกกลับวอเลต', ROLLBACK: 'คืนเงิน', SYNC: 'ซิงก์ยอด', ADJUSTMENT: 'ปรับยอด' };
  return type ? map[type] ?? type : 'โยกเงิน';
}

export function ledgerLabel(type?: string | null) {
  const map: Record<string, string> = { DEPOSIT: 'ฝาก', WITHDRAWAL: 'ถอน', TRANSFER: 'โยกเงิน', REVERSAL: 'คืนเงิน', ADJUSTMENT: 'ปรับยอด', BONUS: 'โบนัส' };
  return type ? map[type] ?? type : '-';
}

export function severityLabel(severity?: string | null) {
  const map: Record<string, string> = { CRITICAL: 'ด่วนมาก', HIGH: 'สูง', MEDIUM: 'กลาง', LOW: 'ต่ำ' };
  return severity ? map[severity] ?? severity : '-';
}

export function checkLabel(key?: string | null) {
  const map: Record<string, string> = {
    adapter_registered: 'มีตัวเชื่อม API', provider_active: 'ค่ายเปิดใช้งาน', transfer_wallet_mode: 'โหมดโยกเงินถูกต้อง', wallet_sync_enabled: 'เชื่อมวอเลตแล้ว',
    launch_endpoint: 'URL เปิดเกม', balance_endpoint: 'URL เช็กยอด', transfer_in_endpoint: 'URL โยกเข้าเกม', transfer_out_endpoint: 'URL โยกกลับวอเลต', webhook_endpoint: 'URL รับ Webhook',
    api_key: 'API Key', webhook_secret: 'Webhook Secret', latest_reconciliation_safe: 'ยอดล่าสุดปลอดภัย', no_unresolved_mismatch: 'ไม่มีปัญหายอดค้าง', real_money_disabled_by_default: 'เงินจริงยังปิดอยู่',
  };
  return key ? map[key] ?? key : '-';
}

export function formatMoney(value: string | number | null | undefined, currency = 'THB') {
  return `${currency} ${Number(value ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}
