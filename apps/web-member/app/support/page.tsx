'use client';

import { useEffect, useMemo, useState } from 'react';
import MemberBottomNav from '../member-bottom-nav';
import { memberApiFetch } from '../member-api';
import { MemberButton, MemberCard, MemberEmptyState, MemberNotice } from '../components/member-ui';
import './member-support.css';

type Ticket = { id: string; subject: string; message: string; status: string; severity: string; category: string; messages?: Array<{ by: string; message: string; createdAt: string }>; createdAt: string };

const faqItems = [
  { category: 'deposit', question: 'ฝากใช้เวลานานแค่ไหน', answer: 'หลังส่งสลิป ระบบจะแสดงสถานะรอตรวจสอบ และอัปเดตเมื่อเจ้าหน้าที่ดำเนินการ' },
  { category: 'withdraw', question: 'ถอนเงินแล้วต้องทำอะไรต่อ', answer: 'ตรวจสอบบัญชีธนาคารและติดตามผลจากหน้าประวัติ ระบบจะแจ้งเมื่อรายการเสร็จสิ้น' },
  { category: 'account', question: 'เข้าสู่ระบบไม่ได้', answer: 'ตรวจสอบเบอร์โทร รหัสผ่าน และสถานะระบบ หากยังมีปัญหาให้สร้างคำร้องช่วยเหลือ' },
  { category: 'general', question: 'คำร้องที่ปิดแล้วตอบเพิ่มได้ไหม', answer: 'ส่งข้อความเพิ่มได้ ระบบจะเปิดคำร้องกลับเป็นสถานะกำลังดูแลโดยอัตโนมัติ' },
  { category: 'general', question: 'ควรใส่อะไรในรายละเอียด', answer: 'ระบุเวลาที่พบปัญหา จำนวนเงินหรือเลขรายการ และสิ่งที่เกิดขึ้น โดยไม่ส่งรหัสผ่านหรือข้อมูลลับ' },
] as const;
const faqCategories = ['all', 'deposit', 'withdraw', 'game', 'account', 'general'] as const;
const SUPPORT_DRAFT_KEY = 'member_support_ticket_draft_v1';

export default function MemberSupportPage() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [category, setCategory] = useState('deposit');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('กำลังโหลดคำร้อง...');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [replyingId, setReplyingId] = useState('');
  const [query, setQuery] = useState('');
  const [faqCategory, setFaqCategory] = useState<(typeof faqCategories)[number]>('all');
  const [ticketFilter, setTicketFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [refType, setRefType] = useState('');
  const [refId, setRefId] = useState('');

  useEffect(() => {
    try {
      const draft = JSON.parse(window.localStorage.getItem(SUPPORT_DRAFT_KEY) ?? '{}') as { category?: string; subject?: string; message?: string };
      if (draft.category) setCategory(draft.category);
      if (draft.subject) setSubject(draft.subject);
      if (draft.message) setMessage(draft.message);
    } catch {}
    const params = new URLSearchParams(window.location.search);
    setRefType(params.get('refType')?.trim() ?? '');
    setRefId(params.get('refId')?.trim() ?? '');
    void load();
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => void load({ silent: true }), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    window.localStorage.setItem(SUPPORT_DRAFT_KEY, JSON.stringify({ category, subject, message }));
  }, [category, message, subject]);

  const openCount = useMemo(() => items.filter((item) => item.status === 'OPEN' || item.status === 'REVIEWING').length, [items]);
  const visibleFaq = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return faqItems.filter((item) => {
      const matchesCategory = faqCategory === 'all' || item.category === faqCategory;
      const matchesQuery = !needle || `${item.question} ${item.answer}`.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [faqCategory, query]);
  const visibleTickets = useMemo(() => items.filter((item) => {
    const open = item.status === 'OPEN' || item.status === 'REVIEWING';
    return ticketFilter === 'ALL' || (ticketFilter === 'OPEN' ? open : !open);
  }), [items, ticketFilter]);

  async function load(options?: { silent?: boolean }) {
    if (!options?.silent) setLoading(true);
    try {
      const res = await memberApiFetch('/member/support-tickets');
      const data = await res.json().catch(() => null);
      if (!res.ok) { setNotice(data?.message ?? 'โหลดคำร้องไม่สำเร็จ'); return; }
      setItems(Array.isArray(data?.items) ? data.items : []);
      setNotice('');
    } catch {
      setNotice('เชื่อมต่อศูนย์ช่วยเหลือไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }

  async function createTicket() {
    if (!subject.trim() || !message.trim()) { setNotice('กรุณาใส่หัวข้อและรายละเอียด'); return; }
    setCreating(true);
    try {
      const res = await memberApiFetch('/member/support-tickets', { method: 'POST', body: JSON.stringify({ category, subject: subject.trim(), message: message.trim(), refType: refType || undefined, refId: refId || undefined }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setNotice(data?.message ?? 'สร้างคำร้องไม่สำเร็จ'); return; }
      setSubject('');
      setMessage('');
      window.localStorage.removeItem(SUPPORT_DRAFT_KEY);
      setNotice('ส่งปัญหาแล้ว');
      await load();
    } catch {
      setNotice('ส่งคำร้องไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setCreating(false);
    }
  }

  async function reply(id: string) {
    const text = (replyText[id] ?? '').trim();
    if (!text) { setNotice('กรุณาใส่ข้อความตอบกลับ'); return; }
    setReplyingId(id);
    try {
      const res = await memberApiFetch(`/member/support-tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ message: text }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setNotice(data?.message ?? 'ตอบกลับไม่สำเร็จ'); return; }
      setReplyText((current) => ({ ...current, [id]: '' }));
      setItems((current) => current.map((item) => item.id === id ? data.item : item));
      setNotice('ตอบกลับแล้ว');
    } catch {
      setNotice('ตอบกลับไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setReplyingId('');
    }
  }

  return <main className="member-support-page">
    <div className="member-support-container">
      <header className="member-support-hero"><div><p>ศูนย์ช่วยเหลือ</p><h1>ติดต่อและติดตามปัญหา</h1><span>แจ้งปัญหาฝาก ถอน เกม หรือบัญชี แล้วติดตามคำตอบจากทีมงาน</span></div><strong>{openCount} เคสที่ยังเปิดอยู่</strong></header>
      {notice && <MemberNotice>{notice}</MemberNotice>}

      <section className="member-support-grid">
        <MemberCard className="member-support-form">
          <div className="member-support-heading"><div><p>คำร้องใหม่</p><h2>แจ้งปัญหา</h2></div></div>
          <label><span>ประเภทปัญหา</span><select disabled={creating} value={category} onChange={(event) => setCategory(event.target.value)}><option value="deposit">ฝาก</option><option value="withdraw">ถอนเงิน</option><option value="game">เกม</option><option value="account">บัญชี</option><option value="general">ทั่วไป</option></select></label>
          {refType && refId && <MemberNotice>คำร้องนี้จะเชื่อมกับรายการ {supportRefLabel(refType)} #{refId}</MemberNotice>}
          <label><span>หัวข้อ</span><input disabled={creating} maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="สรุปปัญหาแบบสั้น ๆ" /></label>
          <label><span>รายละเอียด</span><textarea disabled={creating} maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="อธิบายสิ่งที่เกิดขึ้นและเวลาที่พบปัญหา" /></label>
          {(subject.trim() || message.trim() || (refType && refId)) && <div className="member-support-preview" aria-label="ตัวอย่างคำร้อง"><span>Preview</span><strong>{subject.trim() || 'ยังไม่มีหัวข้อ'}</strong><p>{message.trim() || 'ยังไม่มีรายละเอียด'}</p><small>{categoryLabel(category)}{refType && refId ? ` · อ้างอิง ${supportRefLabel(refType)} #${refId}` : ''}</small></div>}
          <MemberButton disabled={creating || !subject.trim() || !message.trim()} onClick={() => void createTicket()}>{creating ? 'กำลังส่ง...' : 'ส่งปัญหา'}</MemberButton>
        </MemberCard>

        <MemberCard className="member-support-faq">
          <div className="member-support-heading"><div><p>คำถามพบบ่อย</p><h2>ค้นหาคำตอบทันที</h2></div></div>
          <label><span>ค้นหา</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="เช่น ฝาก ถอนเงิน หรือเข้าสู่ระบบ" /></label>
          <div className="member-support-faq-categories" aria-label="หมวด FAQ">{faqCategories.map((value) => <button key={value} type="button" aria-pressed={faqCategory === value} onClick={() => setFaqCategory(value)}>{value === 'all' ? 'ทั้งหมด' : categoryLabel(value)}</button>)}</div>
          <div className="member-support-accordion">{visibleFaq.map(({ question, answer }) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}{visibleFaq.length === 0 && <MemberEmptyState compact title="ไม่พบคำตอบ" description="ลองใช้คำค้นอื่น หรือส่งคำร้องให้ทีมงานตรวจสอบ" />}</div>
        </MemberCard>
      </section>

      <section className="member-support-tickets"><div className="member-support-heading"><div><p>ประวัติคำร้อง</p><h2>คำร้องของฉัน</h2><span>ระบบรีเฟรชคำร้องทุก 60 วินาที และการตอบกลับคำร้องที่ปิดแล้วจะเปิดเคสกลับให้อัตโนมัติ</span></div><div className="member-support-ticket-filters">{(['ALL', 'OPEN', 'CLOSED'] as const).map((value) => <button type="button" key={value} aria-pressed={ticketFilter === value} onClick={() => setTicketFilter(value)}>{value === 'ALL' ? 'ทั้งหมด' : value === 'OPEN' ? 'กำลังดำเนินการ' : 'ปิดแล้ว'}</button>)}<button type="button" disabled={loading} onClick={() => void load()}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</button></div></div>
        {visibleTickets.map((item) => <MemberCard key={item.id} className="member-support-ticket"><div className="member-support-ticket-head"><div><strong>{item.subject}</strong><p>{categoryLabel(item.category)} · {new Date(item.createdAt).toLocaleString('th-TH')}</p></div><span>{statusLabel(item.status)}</span></div><p>{item.message}</p><div className="member-support-thread" aria-label={`Timeline ${item.subject}`}>{(item.messages ?? []).slice(-5).map((msg, index) => <div key={`${item.id}-${index}`}><strong>{msg.by === 'admin' ? 'แอดมิน' : msg.by === 'member' ? 'คุณ' : 'ระบบ'}</strong><span>{msg.message}</span><small>{new Date(msg.createdAt).toLocaleString('th-TH')}</small></div>)}</div><label><span>ตอบกลับ</span><textarea disabled={replyingId === item.id} maxLength={2000} value={replyText[item.id] ?? ''} onChange={(event) => setReplyText((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="พิมพ์ข้อความเพิ่มเติม" /></label><MemberButton disabled={Boolean(replyingId) || !(replyText[item.id] ?? '').trim()} tone="default" onClick={() => void reply(item.id)}>{replyingId === item.id ? 'กำลังส่ง...' : 'ตอบกลับ'}</MemberButton></MemberCard>)}
        {!loading && visibleTickets.length === 0 && <MemberEmptyState title={items.length === 0 ? 'ยังไม่มีคำร้อง' : 'ไม่มีคำร้องในสถานะนี้'} description={items.length === 0 ? 'เมื่อสร้างคำร้อง ระบบจะแสดงสถานะและการตอบกลับไว้ที่นี่' : 'เลือกตัวกรองอื่นเพื่อดูคำร้องที่มีอยู่'} />}
      </section>
    </div>
    <MemberBottomNav />
  </main>;
}

function statusLabel(status: string) { const map: Record<string, string> = { OPEN: 'เปิดอยู่', REVIEWING: 'กำลังดูแล', RESOLVED: 'แก้แล้ว', DISMISSED: 'ปิดแล้ว' }; return map[status] ?? status; }
function categoryLabel(category: string) { const map: Record<string, string> = { deposit: 'ฝาก', withdraw: 'ถอนเงิน', game: 'เกม', account: 'บัญชี', general: 'ทั่วไป' }; return map[category] ?? category; }
function supportRefLabel(refType: string) { const map: Record<string, string> = { deposit: 'ฝากเงิน', topup: 'ฝากเงิน', withdrawal: 'ถอนเงิน', withdraw: 'ถอนเงิน', provider: 'ผู้ให้บริการเกม', game: 'เกม' }; return map[refType] ?? refType; }
