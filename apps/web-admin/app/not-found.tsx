export default function AdminNotFound() {
  return (
    <main className="admin-app-state" role="main">
      <section className="admin-app-state__panel">
        <div className="admin-app-state__icon" aria-hidden="true">404</div>
        <div>
          <p className="admin-app-state__eyebrow">ADMIN WORKSPACE</p>
          <h1 className="admin-app-state__title">ไม่พบหน้าที่ต้องการ</h1>
          <p className="admin-app-state__description">
            ลิงก์นี้อาจถูกย้าย ถูกปิดตามสิทธิ์ หรือพิมพ์ไม่ครบ โปรดกลับไปยังแดชบอร์ดแล้วเลือกเมนูจากระบบอีกครั้ง
          </p>
          <div className="admin-app-state__actions">
            <a className="admin-app-state__primary" href="/dashboard">
              กลับแดชบอร์ด
            </a>
            <a className="admin-app-state__secondary" href="/login">
              ไปหน้าเข้าสู่ระบบ
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
