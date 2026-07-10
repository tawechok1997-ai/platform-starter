import { PublicStatusPage } from '../components/public-status-page';

export default function MaintenancePage() {
  return <PublicStatusPage eyebrow="System status" title="ระบบกำลังปรับปรุง" description="บางบริการอาจไม่พร้อมใช้งานชั่วคราว กรุณากลับมาตรวจสอบอีกครั้งภายหลัง" primaryHref="/login" primaryLabel="ลองเข้าสู่ระบบอีกครั้ง"><p>ข้อมูลบัญชีและยอดเงินของคุณยังคงอยู่ตามเดิม การปิดปรับปรุงหน้านี้ไม่ใช่การลบบัญชีหรือธุรกรรม</p></PublicStatusPage>;
}
