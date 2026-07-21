export type Tone = 'success' | 'warning' | 'danger' | 'neutral';

export function humanStatus(status?: string | null) {
  const map: Record<string, string> = {
    ACTIVE: 'พร้อมใช้งาน', INACTIVE: 'ปิดใช้งาน', MAINTENANCE: 'ปิดปรับปรุง', DEGRADED: 'ใช้งานได้บางส่วน',
    ONLINE: 'ออนไลน์', OFFLINE: 'ออฟไลน์', ENABLED: 'เปิดใช้งาน', DISABLED: 'ปิดใช้งาน', LOCKED: 'ถูกล็อก', SUSPENDED: 'ถูกระงับ', CLOSED: 'ปิดบัญชี',
    SUCCESS: 'สำเร็จ', FAILED: 'ไม่สำเร็จ', PENDING: 'รอดำเนินการ', PROCESSING: 'กำลังดำเนินการ', REVERSED: 'คืนรายการแล้ว', CANCELLED: 'ยกเลิกแล้ว',
    OPEN: 'รอตรวจ', REVIEWING: 'กำลังตรวจ', RESOLVED: 'แก้ไขแล้ว', DISMISSED: 'ปิดรายการแล้ว',
    PENDING_REVIEW: 'รอตรวจ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ไม่อนุมัติ', COMPLETED: 'เสร็จแล้ว',
    PENDING_SLIP_REVIEW: 'รอตรวจสลิป', PENDING_CREDIT: 'รอยืนยันยอด', APPROVED_FOR_PAYMENT: 'รอโอนเงิน', PAYMENT_PROOF_UPLOADED: 'รอตรวจหลักฐาน',
    MATCHED: 'ยอดตรงกัน', MISMATCH: 'ยอดไม่ตรงกัน', UNKNOWN: 'ยังตรวจไม่เสร็จ',
    RECEIVED: 'รับข้อมูลแล้ว', PROCESSED: 'ดำเนินการแล้ว', DUPLICATE: 'รายการซ้ำ', IGNORED: 'ไม่นำมาดำเนินการ',
  };
  return status ? map[status] ?? status : '-';
}

export function statusTone(status?: string | null): Tone {
  if (!status) return 'neutral';
  if (['ACTIVE', 'ONLINE', 'ENABLED', 'SUCCESS', 'RESOLVED', 'MATCHED', 'PROCESSED', 'APPROVED', 'COMPLETED'].includes(status)) return 'success';
  if (['PENDING', 'PROCESSING', 'PENDING_REVIEW', 'PENDING_SLIP_REVIEW', 'PENDING_CREDIT', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED', 'REVIEWING', 'RECEIVED', 'UNKNOWN', 'MAINTENANCE', 'DEGRADED'].includes(status)) return 'warning';
  if (['FAILED', 'OFFLINE', 'REJECTED', 'SUSPENDED', 'LOCKED', 'OPEN', 'MISMATCH', 'CRITICAL', 'HIGH'].includes(status)) return 'danger';
  return 'neutral';
}

export function transferLabel(type?: string | null) {
  const map: Record<string, string> = { TRANSFER_IN: 'โอนเข้าเกม', TRANSFER_OUT: 'โอนกลับกระเป๋าเงิน', ROLLBACK: 'คืนยอด', SYNC: 'ตรวจยอดล่าสุด', ADJUSTMENT: 'ปรับยอด' };
  return type ? map[type] ?? type : 'การโอนเงิน';
}

export function ledgerLabel(type?: string | null) {
  const map: Record<string, string> = { DEPOSIT: 'ฝากเงิน', WITHDRAWAL: 'ถอนเงิน', TRANSFER: 'โอนเงิน', REVERSAL: 'คืนยอด', ADJUSTMENT: 'ปรับยอด', BONUS: 'โบนัส' };
  return type ? map[type] ?? type : '-';
}

export function severityLabel(severity?: string | null) {
  const map: Record<string, string> = { CRITICAL: 'เร่งด่วนที่สุด', HIGH: 'สูง', MEDIUM: 'ปานกลาง', LOW: 'ต่ำ' };
  return severity ? map[severity] ?? severity : '-';
}

export function checkLabel(key?: string | null) {
  const map: Record<string, string> = {
    adapter_registered: 'ติดตั้งตัวเชื่อมต่อ API แล้ว', provider_active: 'ค่ายเปิดใช้งาน', transfer_wallet_mode: 'ตั้งค่าโอนเงินถูกต้อง', wallet_sync_enabled: 'เปิดตรวจยอดกระเป๋าเงินแล้ว',
    launch_endpoint: 'URL เปิดเกม', balance_endpoint: 'URL ตรวจยอด', transfer_in_endpoint: 'URL โอนเข้าเกม', transfer_out_endpoint: 'URL โอนกลับ', webhook_endpoint: 'URL รับ Webhook',
    api_key: 'API Key', webhook_secret: 'Webhook Secret', latest_reconciliation_safe: 'ยอดตรวจล่าสุดปกติ', no_unresolved_mismatch: 'ไม่มีปัญหายอดค้าง', real_money_disabled_by_default: 'ระบบเงินจริงปิดเป็นค่าเริ่มต้น',
  };
  return key ? map[key] ?? key : '-';
}

export function formatMoney(value: string | number | null | undefined, currency = 'THB') {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${currency} ${safeAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}
