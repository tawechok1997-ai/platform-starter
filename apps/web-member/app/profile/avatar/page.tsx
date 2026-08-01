'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { memberApiFetch } from '../../member-api';
import { resolveLocalAssetByBasename } from '../../lib/local-asset-by-basename';
import {
  DEFAULT_MOBILE_AVATAR,
  MOBILE_AVATAR_OPTIONS,
  readMobileAvatarPreference,
  writeMobileAvatarPreference,
} from '../../lib/mobile-avatar-preference';
import { useMemberRuntime } from '../../member-runtime-provider';
import type { MemberBankAccount } from '../../types/member-finance';
import styles from './avatar-page.module.css';

const VIP_BADGE_SOURCE = 'https://cdn.zabbet.com/FEZX/grouptypes/bc954df4-70bb-460c-9ce8-c2cae326acbe.png';
const SELECTED_ICON = '/images/profile/selected.svg';

export default function MobileAvatarPage() {
  const router = useRouter();
  const { profile, summary } = useMemberRuntime();
  const [selected, setSelected] = useState(DEFAULT_MOBILE_AVATAR);
  const [saved, setSaved] = useState(false);
  const [bank, setBank] = useState<MemberBankAccount | null>(null);
  const vipBadge = useMemo(
    () => resolveLocalAssetByBasename(VIP_BADGE_SOURCE, 'mobile')
      || resolveLocalAssetByBasename(VIP_BADGE_SOURCE, 'pc')
      || VIP_BADGE_SOURCE,
    [],
  );

  useEffect(() => {
    setSelected(readMobileAvatarPreference());
  }, []);

  useEffect(() => {
    if (!summary.isLoggedIn) return;
    let active = true;

    void memberApiFetch('/member/bank-accounts')
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!active || !response.ok) return;
        const accounts = ((data?.items ?? []) as MemberBankAccount[])
          .filter((account) => account.status === 'ACTIVE');
        setBank(accounts.find((account) => account.isPrimary) ?? accounts[0] ?? null);
      })
      .catch(() => {
        // The profile page still renders safely when bank data is unavailable.
      });

    return () => {
      active = false;
    };
  }, [summary.isLoggedIn]);

  const profileData = profile as unknown as Record<string, unknown> | null;
  const summaryData = summary as unknown as Record<string, unknown>;
  const phone = textValue(profileData?.phone)
    || textValue(summaryData.username)
    || '-';
  const memberName = textValue(summaryData.displayName)
    || textValue(profileData?.fullName)
    || textValue(profileData?.name)
    || phone;
  const bankName = bank?.bankName
    || textValue(profileData?.bankName)
    || 'SCB';
  const bankAccount = bank?.accountNumber
    || textValue(profileData?.bankAccountNumber)
    || textValue(profileData?.accountNumber)
    || '-';

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
        <section className={styles.profileHero} aria-label="ข้อมูลสมาชิก">
          <img className={styles.currentAvatar} src={selected} alt="รูปโปรไฟล์ที่เลือก" />
          <div className={styles.vipBadge}>
            <div>
              <span>{summary.vipLevel || 'New'}</span>
            </div>
            <img src={vipBadge} alt="" aria-hidden="true" />
          </div>
          <strong className={styles.phone}>{phone}</strong>
          <div className={styles.memberName}>{memberName}</div>
          <div className={styles.bankLine}>
            <img src={bankLogo(bankName)} alt="" aria-hidden="true" />
            <span>{formatAccountNumber(bankAccount)}</span>
          </div>
        </section>

        <section className={styles.actions} aria-label="ตั้งค่าบัญชี">
          <Link href="/profile/edit"><HeadsetIcon /><span>แก้ไข บัญชี/เบอร์โทร</span></Link>
          <Link href="/profile/password"><LockIcon /><span>แก้ไขรหัสผ่าน</span></Link>
        </section>

        <section className={styles.avatarSection} aria-labelledby="avatar-selection-title">
          <h2 id="avatar-selection-title">เลือกรูปโปรไฟล์</h2>
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
          <span className={styles.savedStatus} role="status" aria-live="polite">
            {saved ? 'บันทึกรูปโปรไฟล์แล้ว' : ''}
          </span>
        </section>
      </div>
    </main>
  );
}

function textValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function formatAccountNumber(value: string) {
  if (!value || value === '-') return '-';
  return value.replace(/\s+/g, '').replace(/(.{3})(?=.)/g, '$1 ');
}

function bankLogo(bankName: string) {
  const normalized = bankName.toUpperCase();
  const code = ['SCB', 'KBANK', 'KTB', 'BBL', 'BAY', 'TTB', 'UOBT', 'GSB', 'GHB']
    .find((item) => normalized.includes(item)) ?? 'SCB';
  return `/images/banks/TH/${code}.webp`;
}

function BackIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" /></svg>;
}

function HeadsetIcon() {
  return (
    <svg viewBox="0 0 25 25" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M11.195 22.916a1.302 1.302 0 0 0 1.302 1.302c4.25 0 6.956-.699 8.515-1.317 1.448-.573 2.24-1.899 2.433-3.236.124-.854.25-1.972.25-2.998a1.302 1.302 0 0 0-2.604 0c0 .842-.107 1.819-.223 2.626-.091.627-.418 1.031-.815 1.188-1.22.483-3.596 1.134-7.556 1.134a1.302 1.302 0 0 0-1.302 1.302Z" fill="#e0b1f1" />
      <path fillRule="evenodd" clipRule="evenodd" d="M12.499 4.427c-4.21 0-7.552 3.326-7.552 7.344v2.292H1.301V11.77C1.301 5.663 6.353.781 12.499.781c6.145 0 11.198 4.882 11.198 10.99v2.292H20.05V11.77c0-4.018-3.342-7.344-7.552-7.344Z" fill="#e0b1f1" />
      <path d="M1.301 12.975c0-1.237.802-2.37 2.051-2.682.865-.217 2.017-.464 3.162-.584 1.105-.116 2.182.55 2.384 1.75.118.699.215 1.705.215 3.124 0 1.42-.097 2.427-.215 3.125-.202 1.2-1.279 1.866-2.384 1.75a23.696 23.696 0 0 1-3.162-.584C2.103 18.562 1.3 17.429 1.3 16.192v-3.217Z" fill="#a800cb" />
      <path d="M23.695 12.975c0-1.237-.802-2.37-2.051-2.682a23.7 23.7 0 0 0-3.162-.584c-1.105-.116-2.182.55-2.384 1.75-.118.699-.215 1.705-.215 3.124 0 1.42.097 2.427.215 3.125.202 1.2 1.279 1.866 2.384 1.75a23.7 23.7 0 0 0 3.162-.584c1.249-.312 2.051-1.445 2.051-2.682v-3.217Z" fill="#a800cb" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 25 25" aria-hidden="true">
      <path d="M14.041.781a6.51 6.51 0 0 1 6.487 5.97l.23 2.752a.26.26 0 0 1-.273.281 84.31 84.31 0 0 0-4.067-.127.26.26 0 0 1-.255-.245l-.125-2.11a2.5 2.5 0 0 0-4.994 0l-.124 2.11a.26.26 0 0 1-.255.245c-1.707.028-3.053.077-4.068.127a.26.26 0 0 1-.272-.281l.229-2.752A6.51 6.51 0 0 1 13.042.781h.999Z" fill="#a800cb" />
      <path d="M2.879 15.427c.026-1.282.09-2.315.164-3.122.156-1.718 1.539-2.936 3.207-3.025 1.545-.082 3.935-.166 7.294-.166 3.36 0 5.75.084 7.294.166 1.668.089 3.052 1.307 3.208 3.025.095 1.052.175 2.491.175 4.361 0 1.87-.08 3.309-.175 4.362-.157 1.717-1.54 2.935-3.209 3.025-.698.037-1.57.074-2.627.104.181-.375.282-.796.282-1.241v-2.604a2.865 2.865 0 0 0-2.865-2.864H9.04a5.203 5.203 0 0 0-6.16-2.021Z" fill="#e0b1f1" />
      <path fillRule="evenodd" clipRule="evenodd" d="M1.043 20.312a3.646 3.646 0 0 0 7.052 1.302h2.323v1.302a1.302 1.302 0 0 0 2.604 0v-1.302h1.302v1.302a1.302 1.302 0 0 0 2.604 0v-2.604a1.302 1.302 0 0 0-1.302-1.302H8.095a3.646 3.646 0 0 0-7.052 1.302Zm3.125.781a.781.781 0 1 1 0-1.562H5.21a.781.781 0 1 1 0 1.562H4.168Z" fill="#a800cb" />
    </svg>
  );
}
