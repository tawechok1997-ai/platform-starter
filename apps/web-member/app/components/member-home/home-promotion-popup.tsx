'use client';

type HomePromotionPopupProps = {
  onClose: () => void;
};

export function HomePromotionPopup({ onClose }: HomePromotionPopupProps) {
  return (
    <div className="home-promotion-popup" data-state="open" role="dialog" aria-modal="true" aria-label="โปรโมชั่น">
      <button type="button" className="home-promotion-popup__backdrop" aria-label="ปิดหน้าต่างโปรโมชั่น" onClick={onClose} />
      <section className="home-promotion-popup__panel">
        <header className="home-promotion-popup__header">
          <h2>โปรโมชั่น</h2>
          <button type="button" className="home-promotion-popup__close" onClick={onClose} aria-label="ปิดโปรโมชั่น">×</button>
        </header>
      </section>
    </div>
  );
}
