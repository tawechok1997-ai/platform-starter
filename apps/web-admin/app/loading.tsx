export default function AdminLoading() {
  return (
    <main className="admin-app-state" aria-busy="true" aria-live="polite">
      <section className="admin-app-state__panel" aria-label="กำลังโหลดหน้าผู้ดูแลระบบ">
        <div className="admin-app-state__spinner" aria-hidden="true" />
        <div>
          <p className="admin-app-state__eyebrow">ADMIN WORKSPACE</p>
          <h1 className="admin-app-state__title">กำลังเตรียมข้อมูล</h1>
          <p className="admin-app-state__description">
            ระบบกำลังโหลดสิทธิ์ เมนู และข้อมูลที่จำเป็นสำหรับหน้านี้
          </p>
        </div>
      </section>
    </main>
  );
}
