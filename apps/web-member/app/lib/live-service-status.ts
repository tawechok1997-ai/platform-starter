export type LiveServiceLocale = 'th' | 'en';
export type LiveServiceMode = 'active' | 'maintenance';

export const LIVE_ROUTE = '/live';

export const LIVE_SERVICE_STATUS: { mode: LiveServiceMode } = {
  mode: 'active',
};

export const LIVE_SERVICE_COPY: Record<LiveServiceLocale, {
  badge: string;
  title: string;
  description: string;
  scheduleTitle: string;
  football: string;
  tableStatus: string;
  tableDescription: string;
  details: string;
  home: string;
  sport: string;
}> = {
  th: {
    badge: 'ปิดปรับปรุงชั่วคราว',
    title: 'ระบบถ่ายทอดสดกำลังปรับปรุง',
    description: 'ขณะนี้ระบบถ่ายทอดสดและตารางการแข่งขันปิดปรับปรุงชั่วคราว เรากำลังเชื่อมต่อและตรวจสอบข้อมูลจากผู้ให้บริการ เพื่อให้กลับมาใช้งานได้อย่างถูกต้องและเสถียร',
    scheduleTitle: 'ตารางถ่ายทอดสด',
    football: 'ฟุตบอล',
    tableStatus: 'ปิดปรับปรุง',
    tableDescription: 'ยังไม่เปิดรับชมและเดิมพันในขณะนี้',
    details: 'ดูรายละเอียด',
    home: 'กลับหน้าหลัก',
    sport: 'ไปหมวดกีฬา',
  },
  en: {
    badge: 'Temporarily unavailable',
    title: 'Live streaming is under maintenance',
    description: 'Live streaming and match schedules are temporarily unavailable while we reconnect and verify provider data for reliable service.',
    scheduleTitle: 'Live schedule',
    football: 'Football',
    tableStatus: 'Under maintenance',
    tableDescription: 'Viewing and betting are currently unavailable',
    details: 'View details',
    home: 'Back to home',
    sport: 'Go to sports',
  },
};
