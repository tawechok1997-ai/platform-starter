import { PublicStatusPage } from '../components/public-status-page';

export default function LegalPage() {
  return <PublicStatusPage eyebrow="Legal" title="ข้อมูลทางกฎหมาย" description="หน้านี้เป็นจุดรวมสำหรับข้อกำหนดการใช้งาน นโยบายความเป็นส่วนตัว และข้อมูลที่เกี่ยวข้องกับบริการ" primaryHref="/" primaryLabel="กลับหน้าแรก"><p>ก่อนใช้งานบริการ โปรดอ่านเงื่อนไขและนโยบายฉบับล่าสุดที่ผู้ดูแลระบบเผยแพร่ผ่านเว็บไซต์หรือศูนย์สมาชิก</p></PublicStatusPage>;
}
