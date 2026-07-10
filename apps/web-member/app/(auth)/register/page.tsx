'use client';

import { FormEvent, useEffect, useState } from 'react';
import { API_URL, PublicSiteSettings, defaultSettings, loadPublicSiteSettings, memberFeatureFlags, textSetting } from '../../site-settings';

const REFERRAL_CODE_KEY = 'member_pending_referral_code';

export default function MemberRegisterPage() {
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'info'>('idle');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem('member_access_token') || window.localStorage.getItem('member_refresh_token')) { window.location.replace('/'); return; }
    const ref = new URLSearchParams(window.location.search).get('ref') ?? window.localStorage.getItem(REFERRAL_CODE_KEY) ?? '';
    const cleanRef = normalizeReferralCode(ref);
    if (cleanRef) { setReferralCode(cleanRef); window.localStorage.setItem(REFERRAL_CODE_KEY, cleanRef); }
    loadPublicSiteSettings().then(setSettings).catch(() => setSettings(defaultSettings));
  }, []);

  const siteName = textSetting(settings, 'website', 'site_name', 'Platform Starter');
  const description = textSetting(settings, 'website', 'site_description', 'สมัครครั้งเดียว แล้วจัดการทุกอย่างจากมือถือหรือคอมพิวเตอร์ได้ทันที');
  const primaryColor = textSetting(settings, 'branding', 'primary_color', '#f5c542');
  const backgroundColor = textSetting(settings, 'branding', 'background_color', '#080808');
  const cardColor = textSetting(settings, 'branding', 'card_color', '#181818');
  const textColor = textSetting(settings, 'branding', 'text_color', '#ffffff');
  const logoUrl = textSetting(settings, 'branding', 'logo_url', '');
  const brandMark = textSetting(settings, 'branding', 'brand_mark', siteName.slice(0, 1).toUpperCase() || 'P');
  const flags = memberFeatureFlags(settings);
  const maintenanceEnabled = Boolean(settings.maintenance?.enabled || settings.maintenance?.member_enabled || settings.website?.maintenance_mode);
  const disabled = !flags.registration || maintenanceEnabled || loading;
  const cssVars = { '--color-brand': primaryColor, '--color-bg': backgroundColor, '--color-card': cardColor, '--color-text': textColor } as React.CSSProperties;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (maintenanceEnabled) { setStatus('error'); setMessage('ระบบกำลังปรับปรุง กรุณาลองใหม่ภายหลัง'); return; }
    if (!flags.registration) { setStatus('error'); setMessage('ขณะนี้ปิดรับสมัครสมาชิก'); return; }
    if (!username.trim() || !phone.trim() || !secret.trim()) { setStatus('error'); setMessage('กรุณากรอกข้อมูลให้ครบ'); return; }
    setLoading(true); setStatus('info'); setMessage('กำลังสมัครสมาชิก...');
    const cleanRef = normalizeReferralCode(referralCode);
    const res = await fetch(`${API_URL}/member/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), phone: phone.trim(), email: email.trim() || undefined, secret, deviceId: 'web-member' }) });
    const data = await res.json().catch(() => null); setLoading(false);
    if (!res.ok) { setStatus('error'); setMessage(data?.message ?? 'สมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบข้อมูล'); return; }
    window.localStorage.setItem('member_access_token', data.accessToken);
    window.localStorage.setItem('member_refresh_token', data.refreshToken);
    if (cleanRef) await linkReferralAfterRegister(cleanRef, data.accessToken);
    setStatus('success'); setMessage(cleanRef ? 'สมัครสมาชิกสำเร็จและบันทึกรหัสแนะนำแล้ว' : 'สมัครสมาชิกสำเร็จ');
    window.location.replace('/');
  }

  return <main className="public-auth-page" style={cssVars}>
    <section className="public-auth-shell">
      <aside className="public-auth-brand">
        <div className="public-auth-brand__mark">{logoUrl ? <img src={logoUrl} alt="" /> : brandMark}</div>
        <h1>{siteName}</h1>
        <p>{description}</p>
      </aside>
      <form className="public-auth-card" onSubmit={onSubmit}>
        <div className="public-auth-card__logo"><span>{logoUrl ? <img src={logoUrl} alt="" /> : brandMark}</span></div>
        <div className="public-auth-heading"><h2>สมัครสมาชิก</h2><p>กรอกข้อมูลหลักให้ครบ แล้วเริ่มใช้งานได้ทันที</p></div>
        {(maintenanceEnabled || !flags.registration) && <div className="public-auth-alert public-auth-alert--error">{maintenanceEnabled ? 'ระบบกำลังปรับปรุง' : 'ขณะนี้ปิดรับสมัครสมาชิก'}</div>}
        <label className="public-auth-field">ชื่อผู้ใช้<input className="public-auth-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ตั้งชื่อผู้ใช้" disabled={disabled} autoComplete="username" /></label>
        <label className="public-auth-field">เบอร์โทรศัพท์<input className="public-auth-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="เบอร์โทรศัพท์" disabled={disabled} autoComplete="tel" inputMode="tel" /></label>
        <label className="public-auth-field">อีเมล <small>(ไม่บังคับ)</small><input className="public-auth-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="อีเมล" disabled={disabled} autoComplete="email" type="email" /></label>
        <label className="public-auth-field">รหัสแนะนำ <small>(ไม่บังคับ)</small><input className="public-auth-input" value={referralCode} onChange={(e) => { const value = normalizeReferralCode(e.target.value); setReferralCode(value); if (value) window.localStorage.setItem(REFERRAL_CODE_KEY, value); }} placeholder="รหัสแนะนำ" disabled={disabled} autoComplete="off" /></label>
        <label className="public-auth-field">รหัสผ่าน<div className="public-auth-input-wrap"><input className="public-auth-input" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="ตั้งรหัสผ่าน" type={showSecret ? 'text' : 'password'} disabled={disabled} autoComplete="new-password" style={{ paddingRight: 58 }} /><button type="button" onClick={() => setShowSecret((value) => !value)} className="public-auth-eye" disabled={disabled} aria-label={showSecret ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>{showSecret ? '🙈' : '👁️'}</button></div></label>
        <button type="submit" disabled={disabled} className="public-auth-submit">{loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}</button>
        {message && <div className={`public-auth-alert public-auth-alert--${status === 'error' ? 'error' : status === 'success' ? 'success' : 'info'}`}>{message}</div>}
        {flags.login && <p className="public-auth-footer">มีบัญชีแล้ว? <a href="/login">เข้าสู่ระบบ</a></p>}
      </form>
    </section>
  </main>;
}

async function linkReferralAfterRegister(referralCode: string, token?: string) {
  const accessToken = token || window.localStorage.getItem('member_access_token');
  if (!accessToken) return;
  const res = await fetch(`${API_URL}/member/affiliate/link`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ referralCode }) });
  if (res.ok) window.localStorage.removeItem(REFERRAL_CODE_KEY);
}

function normalizeReferralCode(value: string) {
  return String(value ?? '').trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, '').slice(0, 24);
}
