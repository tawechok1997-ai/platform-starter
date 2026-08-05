import { PublicStatusPage } from '../components/public-status-page';

export default function StatusPage() {
  return (
    <PublicStatusPage
      eyebrow="System status"
      title="ระบบพร้อมให้บริการ"
      description="หน้า Member และบริการหลักพร้อมใช้งาน หากบางค่ายเกมหรือรายการธุรกรรมกำลังตรวจสอบ ระบบจะแสดงสถานะเฉพาะรายการนั้น"
      primaryHref="/"
      primaryLabel="กลับหน้าหลัก"
    >
      <p>สถานะนี้เป็นภาพรวมของหน้าเว็บไซต์ ไม่ได้ใช้ยืนยันผลของรายการฝาก ถอน หรือการเชื่อมต่อค่ายเกมแต่ละรายการ</p>
    </PublicStatusPage>
  );
}
