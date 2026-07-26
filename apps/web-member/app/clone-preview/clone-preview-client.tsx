'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type ScreenKey =
  | 'home'
  | 'login'
  | 'register'
  | 'games'
  | 'promotions'
  | 'activity'
  | 'news'
  | 'deposit'
  | 'withdraw'
  | 'transactions'
  | 'bonus'
  | 'affiliate'
  | 'bank'
  | 'profile'
  | 'notifications'
  | 'support'
  | 'guide'
  | 'contact';

type ModalKey = 'game' | 'promotion' | 'success' | 'error' | 'logout' | 'mini-game' | null;

type Toast = { tone: 'success' | 'error' | 'info'; message: string } | null;

type NavItem = { key: ScreenKey; label: string; icon: string };

const screens: NavItem[] = [
  { key: 'home', label: 'หน้าแรก', icon: '⌂' },
  { key: 'games', label: 'เกมทั้งหมด', icon: '♠' },
  { key: 'promotions', label: 'โปรโมชั่น', icon: '✦' },
  { key: 'activity', label: 'กิจกรรม', icon: '⚑' },
  { key: 'news', label: 'ข่าวสาร', icon: '◈' },
  { key: 'deposit', label: 'ฝากเงิน', icon: '฿' },
  { key: 'withdraw', label: 'ถอนเงิน', icon: '↗' },
  { key: 'transactions', label: 'ประวัติรายการ', icon: '≡' },
  { key: 'bonus', label: 'โบนัส', icon: '★' },
  { key: 'affiliate', label: 'แนะนำเพื่อน', icon: '◎' },
  { key: 'bank', label: 'บัญชีธนาคาร', icon: '▣' },
  { key: 'profile', label: 'โปรไฟล์', icon: '●' },
  { key: 'notifications', label: 'แจ้งเตือน', icon: '◉' },
  { key: 'support', label: 'ช่วยเหลือ', icon: '?' },
  { key: 'guide', label: 'คู่มือ', icon: '▤' },
  { key: 'contact', label: 'ติดต่อเรา', icon: '☎' },
];

const gameNames = ['Caishen Wins', 'Maya Golden City', 'Roma X', 'El Paso', 'Sweet Bonanza Xmas', 'Golden Empire', 'Thai Hi Lo', 'Bushido Ways'];
const providers = ['EVOPLAY', 'CQ9', 'JILI', 'PLAYSTAR', 'JOKER', 'EBET', 'POP K', 'PG SOFT'];
const transactionRows = [
  ['ฝากเงิน', '฿ 5,000.00', 'สำเร็จ', '27 ก.ค. 2026 00:18'],
  ['รับโบนัส', '฿ 500.00', 'สำเร็จ', '26 ก.ค. 2026 22:04'],
  ['ถอนเงิน', '฿ 2,000.00', 'กำลังตรวจสอบ', '26 ก.ค. 2026 20:51'],
  ['เดิมพัน', '฿ 350.00', 'สำเร็จ', '26 ก.ค. 2026 20:12'],
];

export default function ClonePreviewClient() {
  const [screen, setScreen] = useState<ScreenKey>('home');
  const [modal, setModal] = useState<ModalKey>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [balance, setBalance] = useState(195574797);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(gameNames[0]);
  const [depositMethod, setDepositMethod] = useState('ธนาคาร');
  const [profileTab, setProfileTab] = useState('ข้อมูลส่วนตัว');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('screen') as ScreenKey | null;
    if (requested && screens.some((item) => item.key === requested)) setScreen(requested);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('screen', screen);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    setMenuOpen(false);
  }, [screen]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const currentTitle = useMemo(() => screens.find((item) => item.key === screen)?.label ?? 'หน้าแรก', [screen]);

  const navigate = (next: ScreenKey) => setScreen(next);
  const notify = (message: string, tone: Toast['tone'] = 'success') => setToast({ message, tone });

  const requireLogin = (action: () => void) => {
    if (!loggedIn) {
      setScreen('login');
      notify('กรุณาเข้าสู่ระบบก่อนทำรายการ', 'info');
      return;
    }
    action();
  };

  return (
    <main className="clone-preview">
      <header className="clone-header">
        <div className="clone-header__top">
          <button className="clone-mobile-menu" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="เปิดเมนู">☰</button>
          <button className="clone-brand" type="button" onClick={() => navigate('home')}>
            <img src="/reference-v6/logo.webp" alt="NOAH345" />
          </button>
          <button className="clone-circle" type="button" onClick={() => notify('เปลี่ยนภาษาเป็นภาษาไทยแล้ว', 'info')}>🇹🇭</button>
          <button className="clone-circle" type="button" onClick={() => navigate('games')}>⌕</button>
          <button className="clone-mission" type="button" onClick={() => navigate('activity')}>🎰 ภารกิจ</button>
          <span className="clone-spacer" />
          {loggedIn ? (
            <>
              <button className="clone-wallet" type="button" onClick={() => navigate('transactions')}>฿ {balance.toLocaleString('th-TH')}</button>
              <button className="clone-header-button clone-header-button--soft" type="button" onClick={() => setModal('logout')}>ออกจากระบบ</button>
            </>
          ) : (
            <>
              <button className="clone-header-button" type="button" onClick={() => navigate('login')}>เข้าสู่ระบบ</button>
              <button className="clone-header-button clone-header-button--soft" type="button" onClick={() => navigate('register')}>สมัครสมาชิก</button>
            </>
          )}
        </div>
        <nav className={`clone-header__nav${menuOpen ? ' is-open' : ''}`} aria-label="เมนูหลัก">
          {screens.slice(0, 7).map((item) => (
            <button key={item.key} className={screen === item.key ? 'is-active' : ''} type="button" onClick={() => navigate(item.key)}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="clone-layout">
        <aside className={`clone-sidebar${menuOpen ? ' is-open' : ''}`}>
          <div className="clone-sidebar__heading">Frontend Clone Preview</div>
          {screens.map((item) => (
            <button key={item.key} type="button" className={screen === item.key ? 'is-active' : ''} onClick={() => navigate(item.key)}>
              <span>{item.icon}</span><strong>{item.label}</strong><i>›</i>
            </button>
          ))}
          <button type="button" onClick={() => setModal('mini-game')}><span>⚡</span><strong>Mini Game</strong><i>›</i></button>
        </aside>

        <section className="clone-content">
          <div className="clone-page-heading">
            <div><small>NOAH345 FRONTEND</small><h1>{currentTitle}</h1></div>
            <span className="clone-status">Mock data · Backend disconnected</span>
          </div>

          {screen === 'home' && <HomeScreen navigate={navigate} requireLogin={requireLogin} openGame={(name) => { setSelectedGame(name); setModal('game'); }} openPromotion={() => setModal('promotion')} />}
          {screen === 'login' && <AuthScreen mode="login" onSuccess={() => { setLoggedIn(true); setScreen('home'); notify('เข้าสู่ระบบสำเร็จ'); }} navigate={navigate} />}
          {screen === 'register' && <AuthScreen mode="register" onSuccess={() => { setLoggedIn(true); setScreen('home'); notify('สมัครสมาชิกสำเร็จ'); }} navigate={navigate} />}
          {screen === 'games' && <GamesScreen openGame={(name) => requireLogin(() => { setSelectedGame(name); setModal('game'); })} />}
          {screen === 'promotions' && <PromotionScreen title="โปรโมชั่น" openPromotion={() => setModal('promotion')} />}
          {screen === 'activity' && <PromotionScreen title="กิจกรรม" openPromotion={() => setModal('promotion')} />}
          {screen === 'news' && <NewsScreen />}
          {screen === 'deposit' && <DepositScreen method={depositMethod} setMethod={setDepositMethod} onSubmit={(amount) => requireLogin(() => { setBalance((value) => value + amount); setModal('success'); })} />}
          {screen === 'withdraw' && <WithdrawScreen onSubmit={(amount) => requireLogin(() => { if (amount > balance) setModal('error'); else { setBalance((value) => value - amount); setModal('success'); } })} />}
          {screen === 'transactions' && <TransactionsScreen />}
          {screen === 'bonus' && <BonusScreen onClaim={() => requireLogin(() => notify('รับโบนัสจำลองแล้ว'))} />}
          {screen === 'affiliate' && <AffiliateScreen onCopy={() => notify('คัดลอกลิงก์แนะนำแล้ว')} />}
          {screen === 'bank' && <BankScreen onSave={() => requireLogin(() => notify('บันทึกบัญชีธนาคารแล้ว'))} />}
          {screen === 'profile' && <ProfileScreen tab={profileTab} setTab={setProfileTab} onSave={() => requireLogin(() => notify('บันทึกข้อมูลแล้ว'))} />}
          {screen === 'notifications' && <NotificationsScreen onRead={() => notify('อ่านการแจ้งเตือนทั้งหมดแล้ว', 'info')} />}
          {screen === 'support' && <SupportScreen onSubmit={() => requireLogin(() => notify('สร้าง Ticket จำลองแล้ว'))} />}
          {screen === 'guide' && <GuideScreen />}
          {screen === 'contact' && <ContactScreen onContact={() => notify('เปิดช่องทาง LINE จำลอง', 'info')} />}
        </section>
      </div>

      <footer className="clone-footer">
        <div><img src="/reference-v6/logo.webp" alt="NOAH345" /><p>Frontend Clone Preview สำหรับตรวจหน้าและ interaction ก่อนต่อระบบจริง</p></div>
        <div><strong>ทุกหน้าที่ทำไว้</strong><span>{screens.length} หน้าหลัก</span><span>6 modal states</span></div>
        <div><strong>สถานะ</strong><span>Mock data</span><span>API disconnected</span></div>
      </footer>

      {toast && <div className={`clone-toast clone-toast--${toast.tone}`}>{toast.message}</div>}
      {modal && <CloneModal modal={modal} selectedGame={selectedGame} close={() => setModal(null)} confirmLogout={() => { setLoggedIn(false); setModal(null); notify('ออกจากระบบแล้ว', 'info'); }} />}
    </main>
  );
}

function HomeScreen({ navigate, requireLogin, openGame, openPromotion }: { navigate: (screen: ScreenKey) => void; requireLogin: (action: () => void) => void; openGame: (name: string) => void; openPromotion: () => void }) {
  return <div className="clone-stack">
    <section className="clone-hero"><MissingAsset label="HERO PROMOTION ASSET" /><div className="clone-dots">● ● ● ● ● ● ● ● ● ●</div></section>
    <div className="clone-announcement">📣 ยินดีต้อนรับสู่ NOAH345 โปรโมชั่น กิจกรรม และเกมใหม่อัปเดตตลอด 24 ชั่วโมง</div>
    <div className="clone-promo-grid">
      {['โปรโมชั่นพิเศษ', 'กิจกรรม', 'ข่าวสาร'].map((title, index) => <button key={title} type="button" onClick={index === 2 ? () => navigate('news') : openPromotion}><MissingAsset compact label={`${title} ASSET`} /><span><strong>{title}</strong><small>{index === 0 ? 'โปรโมชั่นพิเศษเฉพาะคุณ' : index === 1 ? 'กิจกรรมตลอด 24 ชั่วโมง' : 'ข่าวสารที่คุณไม่ควรพลาด'}</small></span></button>)}
    </div>
    <button className="clone-tournament" type="button" onClick={() => navigate('activity')}><MissingAsset label="TOURNAMENT BANNER ASSET" /></button>
    <Section title="เกมไฮไลท์"><div className="clone-game-grid">{gameNames.map((name) => <GameCard key={name} name={name} onClick={() => openGame(name)} />)}</div></Section>
    <Section title="ทางลัดสมาชิก"><div className="clone-action-grid">{[['ฝากเงิน','deposit'],['ถอนเงิน','withdraw'],['ประวัติ','transactions'],['โบนัส','bonus'],['แนะนำเพื่อน','affiliate'],['โปรไฟล์','profile']].map(([label,key]) => <button key={key} type="button" onClick={() => requireLogin(() => navigate(key as ScreenKey))}>{label}</button>)}</div></Section>
  </div>;
}

function AuthScreen({ mode, onSuccess, navigate }: { mode: 'login' | 'register'; onSuccess: () => void; navigate: (screen: ScreenKey) => void }) {
  const submit = (event: FormEvent) => { event.preventDefault(); onSuccess(); };
  return <div className="clone-auth"><div className="clone-auth__art"><MissingAsset label={mode === 'login' ? 'LOGIN ART ASSET' : 'REGISTER ART ASSET'} /></div><form onSubmit={submit}><img src="/reference-v6/logo.webp" alt="NOAH345" /><h2>{mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</h2>{mode === 'register' && <Field label="ชื่อผู้ใช้" placeholder="กรอกชื่อผู้ใช้" />}<Field label="เบอร์โทรศัพท์" placeholder="08X-XXX-XXXX" /><Field label="รหัสผ่าน" placeholder="••••••••" type="password" />{mode === 'register' && <Field label="ยืนยันรหัสผ่าน" placeholder="••••••••" type="password" />}<button className="clone-primary" type="submit">{mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</button><button className="clone-link" type="button" onClick={() => navigate(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'ยังไม่มีบัญชี? สมัครสมาชิก' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}</button></form></div>;
}

function GamesScreen({ openGame }: { openGame: (name: string) => void }) {
  const [category, setCategory] = useState('ทั้งหมด');
  return <div className="clone-stack"><div className="clone-filter-row">{['ทั้งหมด','คาสิโน','สล็อต','ยิงปลา','กีฬา','ไพ่','หวย'].map((item) => <button key={item} className={category === item ? 'is-active' : ''} type="button" onClick={() => setCategory(item)}>{item}</button>)}</div><Section title={`เกม ${category}`}><div className="clone-game-grid clone-game-grid--large">{[...gameNames, ...gameNames].map((name, index) => <GameCard key={`${name}-${index}`} name={name} onClick={() => openGame(name)} />)}</div></Section></div>;
}

function PromotionScreen({ title, openPromotion }: { title: string; openPromotion: () => void }) {
  return <div className="clone-stack"><div className="clone-banner"><MissingAsset label={`${title.toUpperCase()} BANNER ASSET`} /></div><div className="clone-promotion-list">{Array.from({ length: 6 }, (_, index) => <article key={index}><MissingAsset label={`${title} CARD ${index + 1}`} /><div><h3>{title} NOAH345 #{index + 1}</h3><p>รายละเอียดตัวอย่างสำหรับตรวจ layout และสถานะปุ่มก่อนเชื่อม CMS จริง</p><button type="button" onClick={openPromotion}>ดูรายละเอียด</button></div></article>)}</div></div>;
}

function NewsScreen() { return <div className="clone-news-list">{Array.from({ length: 7 }, (_, index) => <article key={index}><time>27 ก.ค. 2026</time><div><h3>ข่าวสารอัปเดตระบบ #{index + 1}</h3><p>เนื้อหาจำลองสำหรับตรวจหน้า ข่าวสาร รายละเอียด และสถานะอ่านแล้ว</p></div><button type="button">อ่านต่อ</button></article>)}</div>; }

function DepositScreen({ method, setMethod, onSubmit }: { method: string; setMethod: (value: string) => void; onSubmit: (amount: number) => void }) {
  const [amount, setAmount] = useState('1000');
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit(Number(amount || 0)); };
  return <div className="clone-finance"><aside>{['ธนาคาร','QR Payment','ฝากจุดทศนิยม','TrueWallet'].map((item) => <button key={item} type="button" className={method === item ? 'is-active' : ''} onClick={() => setMethod(item)}>{item}</button>)}</aside><form onSubmit={submit}><h2>ฝากเงินผ่าน {method}</h2><MissingAsset label={`${method.toUpperCase()} INSTRUCTION ASSET`} /><Field label="จำนวนเงิน" value={amount} onChange={setAmount} /><div className="clone-amounts">{[300,500,1000,3000,5000].map((value) => <button key={value} type="button" onClick={() => setAmount(String(value))}>฿ {value.toLocaleString('th-TH')}</button>)}</div><button className="clone-primary" type="submit">ยืนยันฝากเงิน</button></form></div>;
}

function WithdrawScreen({ onSubmit }: { onSubmit: (amount: number) => void }) {
  const [amount, setAmount] = useState('1000');
  return <form className="clone-form-card" onSubmit={(event) => { event.preventDefault(); onSubmit(Number(amount || 0)); }}><h2>ถอนเงิน</h2><div className="clone-bank-card"><span>SCB</span><strong>XXX-X-X7890-X</strong><small>บัญชีหลัก</small></div><Field label="จำนวนเงินที่ต้องการถอน" value={amount} onChange={setAmount} /><Field label="รหัสถอนเงิน" placeholder="••••••" type="password" /><button className="clone-primary" type="submit">ยืนยันถอนเงิน</button></form>;
}

function TransactionsScreen() { return <div className="clone-table-card"><div className="clone-filter-row"><button className="is-active" type="button">ทั้งหมด</button><button type="button">ฝาก</button><button type="button">ถอน</button><button type="button">โบนัส</button></div><table><thead><tr><th>ประเภท</th><th>จำนวน</th><th>สถานะ</th><th>เวลา</th></tr></thead><tbody>{transactionRows.map((row) => <tr key={row.join('-')}>{row.map((cell, index) => <td key={cell} data-status={index === 2 ? cell : undefined}>{cell}</td>)}</tr>)}</tbody></table></div>; }

function BonusScreen({ onClaim }: { onClaim: () => void }) { return <div className="clone-card-grid">{['โบนัสต้อนรับ','โบนัสคืนยอดเสีย','โบนัสฝากประจำ','ภารกิจรายวัน'].map((title, index) => <article key={title}><span className="clone-badge">{index === 0 ? 'พร้อมรับ' : 'กำลังทำ'}</span><MissingAsset label={`${title} ASSET`} /><h3>{title}</h3><p>ยอดเทิร์น {index * 15 + 20}% · หมดอายุใน 3 วัน</p><button type="button" onClick={onClaim}>{index === 0 ? 'รับโบนัส' : 'ดูรายละเอียด'}</button></article>)}</div>; }

function AffiliateScreen({ onCopy }: { onCopy: () => void }) { return <div className="clone-stack"><div className="clone-stat-grid">{[['ยอดแนะนำ','18 คน'],['ค่าคอมวันนี้','฿ 12,450'],['ยอดรอรับ','฿ 4,280']].map(([label,value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div><div className="clone-form-card"><h2>ลิงก์แนะนำของคุณ</h2><div className="clone-copy-row"><input readOnly value="https://noah345.shop/register?ref=NOAH345" /><button type="button" onClick={onCopy}>คัดลอก</button></div></div></div>; }

function BankScreen({ onSave }: { onSave: () => void }) { return <div className="clone-stack"><div className="clone-bank-card clone-bank-card--large"><span>บัญชีธนาคารหลัก</span><strong>ธนาคารไทยพาณิชย์</strong><small>XXX-X-X7890-X · นาย NOAH MEMBER</small></div><form className="clone-form-card" onSubmit={(event) => { event.preventDefault(); onSave(); }}><h2>เพิ่มบัญชีธนาคาร</h2><Field label="ธนาคาร" placeholder="เลือกธนาคาร" /><Field label="เลขบัญชี" placeholder="กรอกเลขบัญชี" /><Field label="ชื่อบัญชี" placeholder="ชื่อต้องตรงกับสมาชิก" /><button className="clone-primary" type="submit">บันทึกบัญชี</button></form></div>; }

function ProfileScreen({ tab, setTab, onSave }: { tab: string; setTab: (value: string) => void; onSave: () => void }) { return <div className="clone-stack"><div className="clone-tabs">{['ข้อมูลส่วนตัว','ความปลอดภัย','รหัสถอนเงิน','อุปกรณ์ที่เข้าสู่ระบบ'].map((item) => <button key={item} className={tab === item ? 'is-active' : ''} type="button" onClick={() => setTab(item)}>{item}</button>)}</div><form className="clone-form-card" onSubmit={(event) => { event.preventDefault(); onSave(); }}><h2>{tab}</h2><Field label="ชื่อผู้ใช้" value="NOAH_MEMBER" /><Field label="เบอร์โทรศัพท์" value="08X-XXX-1234" /><Field label="อีเมล" value="member@example.com" /><button className="clone-primary" type="submit">บันทึกข้อมูล</button></form></div>; }

function NotificationsScreen({ onRead }: { onRead: () => void }) { return <div className="clone-stack"><button className="clone-secondary clone-align-right" type="button" onClick={onRead}>อ่านทั้งหมด</button><div className="clone-news-list">{['ฝากเงินสำเร็จ','รายการถอนกำลังตรวจสอบ','โบนัสใหม่พร้อมรับ','เข้าสู่ระบบจากอุปกรณ์ใหม่'].map((title, index) => <article key={title} className={index < 2 ? 'is-unread' : ''}><span className="clone-notification-dot" /><div><h3>{title}</h3><p>ข้อความแจ้งเตือนจำลองสำหรับตรวจสถานะอ่านแล้วและยังไม่อ่าน</p></div><time>{index + 1} ชม.</time></article>)}</div></div>; }

function SupportScreen({ onSubmit }: { onSubmit: () => void }) { return <div className="clone-finance"><aside><button className="is-active" type="button">Ticket ของฉัน</button><button type="button">คำถามที่พบบ่อย</button><button type="button">ติดต่อเจ้าหน้าที่</button></aside><form onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><h2>เปิด Ticket ใหม่</h2><Field label="หัวข้อ" placeholder="ระบุหัวข้อที่ต้องการความช่วยเหลือ" /><label className="clone-field"><span>รายละเอียด</span><textarea placeholder="อธิบายปัญหาให้ละเอียด" /></label><button className="clone-primary" type="submit">ส่ง Ticket</button></form></div>; }

function GuideScreen() { return <div className="clone-accordion">{['ฝากเงินแบบโอนผ่านธนาคาร','ฝากเงินผ่าน QR Payment','ฝากเงินแบบจุดทศนิยม','วิธีฝากผ่าน TrueWallet','ถอนเงินต้องทำอย่างไร'].map((title, index) => <details key={title} open={index === 0}><summary>{title}</summary><p>คำอธิบายจำลองเพื่อทดสอบ accordion, spacing และสถานะเปิดปิดก่อนนำข้อมูลจริงจาก CMS มาใช้</p></details>)}</div>; }

function ContactScreen({ onContact }: { onContact: () => void }) { return <div className="clone-contact-grid">{[['LINE','ติดต่อฝ่ายบริการ 24 ชั่วโมง'],['Live Chat','ตอบกลับภายใน 1 นาที'],['Ticket','ติดตามสถานะได้ในระบบ']].map(([title,description]) => <button key={title} type="button" onClick={onContact}><strong>{title}</strong><span>{description}</span></button>)}</div>; }

function CloneModal({ modal, selectedGame, close, confirmLogout }: { modal: Exclude<ModalKey, null>; selectedGame: string; close: () => void; confirmLogout: () => void }) {
  const content = {
    game: { title: selectedGame, body: <><MissingAsset label="GAME LAUNCH FRAME" /><p>หน้าต่างเปิดเกมจำลอง พร้อม loading, fullscreen และปิดเกม</p></>, action: 'เข้าเล่นเกม' },
    promotion: { title: 'รายละเอียดโปรโมชั่น', body: <><MissingAsset label="PROMOTION DETAIL ASSET" /><p>เงื่อนไข ระยะเวลา และปุ่มรับสิทธิ์จะแสดงใน modal นี้</p></>, action: 'รับโปรโมชั่น' },
    success: { title: 'ทำรายการสำเร็จ', body: <p>ระบบจำลองบันทึกสถานะสำเร็จแล้ว</p>, action: 'ตกลง' },
    error: { title: 'ทำรายการไม่สำเร็จ', body: <p>ยอดเงินไม่เพียงพอ หรือข้อมูลยังไม่ครบถ้วน</p>, action: 'กลับไปแก้ไข' },
    logout: { title: 'ออกจากระบบ', body: <p>ยืนยันการออกจากบัญชีนี้หรือไม่</p>, action: 'ยืนยันออกจากระบบ' },
    'mini-game': { title: 'Mini Game', body: <><MissingAsset label="MINI GAME ASSET" /><p>วงล้อและภารกิจจำลองสำหรับตรวจ animation และ reward state</p></>, action: 'เริ่มเล่น' },
  }[modal];
  return <div className="clone-modal-backdrop" role="presentation" onMouseDown={close}><section className="clone-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button className="clone-modal__close" type="button" onClick={close}>×</button><h2>{content.title}</h2><div className="clone-modal__body">{content.body}</div><div className="clone-modal__actions"><button type="button" onClick={close}>ยกเลิก</button><button className="clone-primary" type="button" onClick={modal === 'logout' ? confirmLogout : close}>{content.action}</button></div></section></div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="clone-section"><header><h2>{title}</h2><button type="button">ดูทั้งหมด ›</button></header>{children}</section>; }
function GameCard({ name, onClick }: { name: string; onClick: () => void }) { return <button className="clone-game-card" type="button" onClick={onClick}><MissingAsset label={`${name} IMAGE`} /><span><strong>{name}</strong><small>NOAH345</small></span></button>; }
function MissingAsset({ label, compact = false }: { label: string; compact?: boolean }) { return <span className={`clone-missing${compact ? ' clone-missing--compact' : ''}`}><b>MISSING ASSET</b><small>{label}</small></span>; }
function Field({ label, placeholder = '', type = 'text', value, onChange }: { label: string; placeholder?: string; type?: string; value?: string; onChange?: (value: string) => void }) { return <label className="clone-field"><span>{label}</span><input type={type} placeholder={placeholder} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} /></label>; }
