import { PublicStatusPage } from '../components/public-status-page';

export default function SessionExpiredPage() {
  return <PublicStatusPage eyebrow="Account security" title="เซสชันหมดอายุ" description="เพื่อความปลอดภัย กรุณาเข้าสู่ระบบใหม่ก่อนดำเนินการต่อ" primaryHref="/login" primaryLabel="เข้าสู่ระบบใหม่"><p>รายการที่ยังไม่ได้ส่งอาจต้องกรอกใหม่ ระบบจะไม่ดำเนินธุรกรรมโดยอัตโนมัติหลังเซสชันหมดอายุ</p></PublicStatusPage>;
}
