'use client';

import Link from 'next/link';
import {
  API_URL,
  type CmsContent,
  type MemberFeatureFlags,
  cmsAssetUrl,
} from '../site-settings';
import { MemberIcon } from './member-icon';
import { MemberRuntimeImage } from './member-runtime-image';
import type { Game, LedgerItem, MoneyRequest } from '../types/member-api';
import { MemberButton, MemberCard, MemberEmptyState, MemberLinkButton, MemberNotice } from './member-ui';

export function PendingRequests({
  pendingTopups,
  pendingWithdrawals,
  features,
}: {
  pendingTopups: MoneyRequest[];
  pendingWithdrawals: MoneyRequest[];
  primaryColor: string;
  features: MemberFeatureFlags;
}) {
  const topups = safeArray(pendingTopups);
  const withdrawals = safeArray(pendingWithdrawals);
  const count = topups.length + withdrawals.length;
  if (!count) return null;

  return (
    <MemberCard tone="warning" className="member-home-panel--brand">
      <div className="member-home-section-head">
        <div>
          <p>รอดำเนินการ</p>
          <h2>{count} รายการ</h2>
        </div>
        <Link href="/transactions">ดูทั้งหมด</Link>
      </div>
      <div className="member-home-list">
        {features.deposit &&
          topups.map((item, index) => (
            <ActivityRow key={item?.id || `topup-${index}`} title="ฝาก" href="/deposit" item={item} />
          ))}
        {features.withdraw &&
          withdrawals.map((item, index) => (
            <ActivityRow
              key={item?.id || `withdrawal-${index}`}
              title="ถอนเงิน"
              href="/withdraw"
              item={item}
            />
          ))}
      </div>
    </MemberCard>
  );
}

export function GameRail({ title, href, items }: { title: string; href: string; items: Game[]; primaryColor: string }) {
  const games = safeArray(items).filter((game) => game && typeof game === 'object');
  if (!games.length) return null;

  return (
    <MemberCard>
      <div className="member-home-section-head">
        <h2>{title}</h2>
        <Link href={href}>ดูทั้งหมด</Link>
      </div>
      <div className="member-home-game-rail">
        {games.slice(0, 8).map((game, index) => {
          const name = typeof game.name === 'string' && game.name.trim() ? game.name : 'เกม';
          const image = pickImage(game);
          return (
            <Link key={game.id || `${name}-${index}`} href="/games" className="member-home-game-tile">
              {image ? (
                <MemberRuntimeImage
                  src={image}
                  alt={name}
                  width={240}
                  height={240}
                  sizes="(max-width: 720px) 42vw, 180px"
                />
              ) : (
                <div className="member-home-game-fallback">{name.slice(0, 2).toUpperCase()}</div>
              )}
              <strong>{name}</strong>
              <span>{game.provider?.name ?? game.providerGameCode ?? ''}</span>
            </Link>
          );
        })}
      </div>
    </MemberCard>
  );
}

export function GameRailSkeleton() {
  return (
    <section className="member-home-game-skeleton" aria-label="กำลังโหลดเกม" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="member-home-game-skeleton__card">
          <span />
          <strong />
          <small />
        </div>
      ))}
    </section>
  );
}

export function GameLobbyState({
  tone,
  message,
  onRetry,
}: {
  tone: 'empty' | 'error';
  message?: string | undefined;
  onRetry?: (() => void) | undefined;
}) {
  if (tone === 'error') {
    return (
      <MemberNotice tone="danger">
        <strong>โหลดเกมไม่สำเร็จ</strong>
        <span>{message || 'กรุณาลองใหม่อีกครั้ง'}</span>
        {onRetry && <MemberButton onClick={onRetry}>ลองใหม่</MemberButton>}
      </MemberNotice>
    );
  }

  return (
    <MemberEmptyState
      compact
      title="ยังไม่มีเกมให้แสดง"
      description="เกมที่เปิดให้บริการจะแสดงในหน้านี้"
      actionHref="/games"
      actionLabel="ไปหน้าเกม"
    />
  );
}

export function FaqList({ content }: { content: CmsContent }) {
  const items = safeArray(content?.faqs)
    .filter((item) => item?.enabled)
    .slice(0, 4);
  if (!items.length) return null;

  return (
    <MemberCard>
      <div className="member-home-section-head">
        <h2>คำถามที่พบบ่อย</h2>
      </div>
      <div className="member-home-list">
        {items.map((item, index) => (
          <details key={`${item?.question || 'faq'}-${index}`} className="member-home-faq">
            <summary>{item?.question || 'คำถาม'}</summary>
            <p className="member-home-muted">{item?.answer || ''}</p>
          </details>
        ))}
      </div>
    </MemberCard>
  );
}

export function SupportCard() {
  return (
    <MemberCard className="member-home-support-card">
      <div className="member-home-support-card__icon">
        <MemberIcon name="support" />
      </div>
      <div className="member-home-support-card__copy">
        <h2>ต้องการความช่วยเหลือ?</h2>
        <p>ติดต่อทีมงานหรือดูคู่มือการใช้งานได้จากที่นี่</p>
      </div>
      <div className="member-home-support-card__actions">
        <Link href="/support">เปิด Ticket</Link>
        <Link href="/guide">ดูคู่มือ</Link>
      </div>
    </MemberCard>
  );
}

export function RecentActivity({
  ledgers,
  loading,
  message,
  onRetry,
  depositEnabled,
}: {
  ledgers: LedgerItem[];
  loading: boolean;
  message: string;
  onRetry: () => void;
  primaryColor: string;
  depositEnabled: boolean;
}) {
  const items = safeArray(ledgers);
  return (
    <MemberCard>
      <div className="member-home-section-head">
        <h2>ล่าสุด</h2>
        <Link href="/transactions">ทั้งหมด</Link>
      </div>
      {loading && <MemberNotice>กำลังโหลด...</MemberNotice>}
      {message && (
        <MemberNotice tone="danger">
          <strong>โหลดข้อมูลไม่สำเร็จ</strong>
          <span>{message}</span>
          <MemberButton onClick={onRetry}>ลองใหม่</MemberButton>
        </MemberNotice>
      )}
      <div className="member-home-list">
        {items.slice(0, 5).map((item, index) => (
          <LedgerRow key={item?.id || `ledger-${index}`} item={item} />
        ))}
        {items.length === 0 && !message && !loading && (
          <MemberEmptyState
            compact
            title="ยังไม่มีประวัติ"
            description="เมื่อมีรายการฝาก ถอน หรือปรับยอด รายการล่าสุดจะแสดงตรงนี้"
            actionHref={depositEnabled ? '/deposit' : '/'}
            actionLabel={depositEnabled ? 'ฝาก' : 'หน้าแรก'}
          />
        )}
      </div>
    </MemberCard>
  );
}

export function CmsPopup({
  content,
  onClose,
}: {
  content: CmsContent;
  primaryColor: string;
  onClose: () => void;
}) {
  const popup = content?.popup;
  if (!popup || typeof popup !== 'object') return null;
  const imageUrl = resolveCmsUrl(cmsAssetUrl(content, popup.assetId) || popup.imageUrl || '');

  return (
    <div className="member-home-popup">
      <MemberCard tone="brand" className="member-home-popup__card">
        <button type="button" onClick={onClose} className="member-home-popup__close" aria-label="ปิดประกาศ">
          ×
        </button>
        {imageUrl && (
          <MemberRuntimeImage
            src={imageUrl}
            alt={popup.title || 'ประกาศ'}
            className="member-home-popup__image"
            width={720}
            height={720}
            sizes="(max-width: 720px) 86vw, 520px"
          />
        )}
        <h2>{popup.title || 'ประกาศ'}</h2>
        <p className="member-home-muted">{popup.message || ''}</p>
        <MemberLinkButton href={popup.href || '/'} tone="brand">
          {popup.ctaLabel || 'ปิด'}
        </MemberLinkButton>
      </MemberCard>
    </div>
  );
}

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function resolveCmsUrl(value: string) {
  return typeof value === 'string' && value.startsWith('/public/cms-assets/')
    ? `${API_URL.replace(/\/$/, '')}${value}`
    : typeof value === 'string'
      ? value
      : '';
}

function ActivityRow({ title, href, item }: { title: string; href: string; item: MoneyRequest }) {
  return (
    <Link href={href} className="member-home-row member-home-row--link">
      <div>
        <strong>{title}</strong>
        <span>{formatDate(item?.createdAt)}</span>
      </div>
      <div className="member-home-row__right">
        <strong>{formatMoney(item?.amount, item?.currency)}</strong>
        <span>{statusLabel(item?.status)}</span>
      </div>
    </Link>
  );
}

function LedgerRow({ item }: { item: LedgerItem }) {
  const isCredit = item?.direction === 'CREDIT';
  return (
    <div className="member-home-row">
      <div>
        <strong>{ledgerTypeLabel(item?.type)}</strong>
        <span>{formatDate(item?.createdAt)}</span>
      </div>
      <div className="member-home-row__right">
        <strong className={`member-transaction-amount ${isCredit ? 'is-credit' : 'is-debit'}`}>
          {isCredit ? '+' : '−'} {formatMoney(item?.amount, 'THB')}
        </strong>
        <span className="member-transaction-status is-success">สำเร็จ</span>
      </div>
    </div>
  );
}

function formatDate(value: unknown) {
  const date = new Date(typeof value === 'string' || typeof value === 'number' ? value : 0);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('th-TH');
}

function ledgerTypeLabel(type: unknown) {
  const upper = typeof type === 'string' ? type.toUpperCase() : '';
  if (upper.includes('DEPOSIT') || upper.includes('TOPUP')) return 'ฝาก';
  if (upper.includes('WITHDRAW')) return 'ถอนเงิน';
  if (upper.includes('TRANSFER')) return 'โยกเงิน';
  if (upper.includes('REVERSAL')) return 'คืนเงิน';
  if (upper.includes('ADJUST')) return 'ปรับยอด';
  return 'รายการ';
}

function statusLabel(status: unknown) {
  const value = typeof status === 'string' ? status : '';
  const upper = value.toUpperCase();
  if (upper === 'PENDING') return 'รอตรวจสอบ';
  if (upper === 'APPROVED' || upper === 'COMPLETED') return 'สำเร็จ';
  if (upper === 'REJECTED') return 'ไม่อนุมัติ';
  return value || '-';
}

function pickImage(game: Game) {
  const media = Array.isArray(game?.media) ? game.media : [];
  return (
    media.find((item) => item?.type === 'COVER')?.cachedUrl ??
    media.find((item) => item?.type === 'COVER')?.sourceUrl ??
    media.find((item) => item?.type === 'ICON')?.cachedUrl ??
    media.find((item) => item?.type === 'ICON')?.sourceUrl ??
    null
  );
}

function formatMoney(value: unknown, currency: unknown) {
  const amount = Number(value);
  return `${typeof currency === 'string' && currency ? currency : 'THB'} ${
    Number.isFinite(amount) ? amount.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '0.00'
  }`;
}
