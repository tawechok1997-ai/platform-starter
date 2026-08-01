'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveLocalAssetByBasename } from '../../lib/local-asset-by-basename';
import {
  DEFAULT_MOBILE_AVATAR,
  MOBILE_AVATAR_OPTIONS,
  readMobileAvatarPreference,
  writeMobileAvatarPreference,
} from '../../lib/mobile-avatar-preference';
import { useMemberRuntime } from '../../member-runtime-provider';
import MobileMemberPopupRuntime from '../../components/mobile-home/mobile-member-popup-runtime';
import styles from './avatar-page.module.css';

const VIP_BADGE_SOURCE = 'https://cdn.zabbet.com/FEZX/grouptypes/bc954df4-70bb-460c-9ce8-c2cae326acbe.png';
const SELECTED_ICON = '/images/profile/selected.svg';

export default function MobileAvatarPage() {
  const router = useRouter();
  const { profile, summary } = useMemberRuntime();
  const [selected, setSelected] = useState(DEFAULT_MOBILE_AVATAR);
  const [saved, setSaved] = useState(false);
  const vipBadge = useMemo(
    () => resolveLocalAssetByBasename(VIP_BADGE_SOURCE, 'mobile')
      || resolveLocalAssetByBasename(VIP_BADGE_SOURCE, 'pc')
      || VIP_BADGE_SOURCE,
    [],
  );

  useEffect(() => {
    setSelected(readMobileAvatarPreference());
  }, []);

  const memberName = summary.displayName || summary.username || profile?.phone || 'สมาชิก';
  const contact = profile?.phone || profile?.email || summary.username || '-';
  const walletMeta = `${summary.walletCurrency || 'THB'} ${summary.walletAvailable || '0.00'}`;

  function chooseAvatar(avatar: string) {
    const value = writeMobileAvatarPreference(avatar);
    setSelected(value);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <main className={styles.root} data-mobile-avatar-owner="true">
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={() => router.back()}><BackIcon /></button>
        <h1>รายละเอียดโปรไฟล์</h1>
        <span aria-hidden="true" />
      </header>

      <div className={styles.body}>
        <section className={styles.profileCard}>
          <img className={styles.currentAvatar} src={selected} alt="รูปโปรไฟล์ที่เลือก" />
          <div className={styles.profileDetails}>
            <div className={styles.vipBadge}>
              <img src={vipBadge} alt="" aria-hidden="true" />
              <span>{summary.vipLevel || 'New'}</span>
            </div>
            <strong>{memberName}</strong>
            <span>{contact}</span>
            <small>{walletMeta}</small>
          </div>
        </section>

        <section className={styles.actions} aria-label="ตั้งค่าบัญชี">
          <Link href="/profile/edit" data-mobile-member-popup="contact"><EditIcon /><span>แก้ไข บัญชี/เบอร์โทร</span><ChevronIcon /></Link>
          <Link href="/profile/password" data-mobile-member-popup="password"><LockIcon /><span>แก้ไขรหัสผ่าน</span><ChevronIcon /></Link>
        </section>

        <section className={styles.avatarSection} aria-labelledby="avatar-selection-title">
          <header>
            <h2 id="avatar-selection-title">เลือกรูปโปรไฟล์</h2>
            {saved ? <span role="status">บันทึกแล้ว</span> : null}
          </header>
          <div className={styles.avatarGrid}>
            {MOBILE_AVATAR_OPTIONS.map((avatar, index) => {
              const active = avatar === selected;
              return (
                <button
                  key={avatar}
                  type="button"
                  className={active ? styles.avatarActive : ''}
                  aria-label={`เลือกรูปโปรไฟล์ ${index + 1}`}
                  aria-pressed={active}
                  onClick={() => chooseAvatar(avatar)}
                >
                  <img src={avatar} alt="" />
                  {active ? <img className={styles.selectedIcon} src={SELECTED_ICON} alt="เลือกแล้ว" /> : null}
                </button>
              );
            })}
          </div>
        </section>
      </div>
      <MobileMemberPopupRuntime />
    </main>
  );
}

function BackIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" /></svg>;
}

function ChevronIcon() {
  return <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M7.92 6.5 5.12 9.3 5.83 10l4-4-4-4-.71.7 2.8 2.8H1.83v1h6.09Z" /></svg>;
}

function EditIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.75 4.75L8 20l11-11-4-4L4 16Zm13.5-13.5 4 4-1.7 1.7-4-4 1.7-1.7Z" /></svg>;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v10h14V10a2 2 0 0 0-2-2Zm-7-2a2 2 0 0 1 4 0v2h-4V6Zm3 9.73V18h-2v-2.27a2 2 0 1 1 2 0Z" /></svg>;
}
