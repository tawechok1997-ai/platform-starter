'use client';

import { useCallback, useEffect, useState } from 'react';
import { memberApiFetch } from '../../member-api';
import styles from './demo-slot.module.css';

type SlotRound = {
  roundId: string;
  result: 'WIN' | 'LOSS';
  status: 'BET' | 'SETTLED' | 'REFUNDED' | 'ROLLED_BACK';
  betAmount: string;
  winAmount: string;
  netAmount: string;
  balance: string;
  canRollback: boolean;
  createdAt: string;
  transactions: Array<{
    id: string;
    operation: string;
    amount: string;
    balanceBefore: string;
    balanceAfter: string;
    transactionId: string;
    createdAt: string;
  }>;
};

type HistoryPayload = {
  ok?: boolean;
  items?: SlotRound[];
  balance?: string;
  message?: string | string[];
  error?: string;
};

type Props = {
  sessionId: string;
  busy: boolean;
  onBalanceChange: (balance: string) => void;
};

export function DemoSlotRoundHistory({ sessionId, busy, onBalanceChange }: Props) {
  const [rounds, setRounds] = useState<SlotRound[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollingBack, setRollingBack] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!sessionId) return;
    if (!silent) setLoading(true);
    try {
      const response = await memberApiFetch(
        `/member/provider-simulator/sessions/${encodeURIComponent(sessionId)}/rounds`,
      );
      const payload = await response.json().catch(() => null) as HistoryPayload | null;
      if (!response.ok || !payload?.ok) throw new Error(readMessage(payload, 'โหลดประวัติรอบไม่สำเร็จ'));
      setRounds(Array.isArray(payload.items) ? payload.items : []);
      setError('');
    } catch (caught) {
      if (!silent) setError(caught instanceof Error ? caught.message : 'โหลดประวัติรอบไม่สำเร็จ');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
    if (!sessionId) return undefined;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !busy && !rollingBack) void load(true);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [busy, load, rollingBack, sessionId]);

  async function rollback(round: SlotRound) {
    if (!round.canRollback || busy || rollingBack) return;
    setRollingBack(round.roundId);
    setError('');
    try {
      const response = await memberApiFetch(
        `/member/provider-simulator/sessions/${encodeURIComponent(sessionId)}/rounds/${encodeURIComponent(round.roundId)}/rollback`,
        { method: 'POST' },
      );
      const payload = await response.json().catch(() => null) as HistoryPayload | null;
      if (!response.ok || !payload?.ok) throw new Error(readMessage(payload, 'ย้อนรอบไม่สำเร็จ'));
      if (typeof payload.balance === 'string') onBalanceChange(payload.balance);
      await load(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'ย้อนรอบไม่สำเร็จ');
    } finally {
      setRollingBack('');
    }
  }

  return (
    <section data-demo-slot-ledger-history="true">
      <div className={styles.sectionTitle}>
        <strong>ประวัติจาก Wallet Ledger</strong>
        <button className={styles.ghostButton} type="button" onClick={() => void load()} disabled={loading || busy || Boolean(rollingBack)}>
          {loading ? 'กำลังโหลด...' : `${rounds.length} รอบ · รีเฟรช`}
        </button>
      </div>
      {error ? <div className={`${styles.notice} ${styles.error}`} role="alert">{error}</div> : null}
      <div className={styles.history}>
        {rounds.map((round) => (
          <div className={styles.historyRow} key={round.roundId}>
            <div>
              <strong>{statusLabel(round)}</strong>
              <span className={styles.historyMeta}>
                {new Date(round.createdAt).toLocaleString('th-TH')} · เดิมพัน {formatCredits(round.betAmount)}
              </span>
              <span className={styles.historyMeta}>
                WIN {formatCredits(round.winAmount)} · สุทธิ {signedCredits(round.netAmount)}
              </span>
              <span className={styles.sessionText}>{round.roundId}</span>
              <span className={styles.historyMeta}>
                {round.transactions.map((item) => item.operation).join(' → ')}
              </span>
            </div>
            <div className={styles.historyResult}>
              <strong className={Number(round.netAmount) > 0 ? styles.resultWin : Number(round.netAmount) < 0 ? styles.resultLoss : ''}>
                {round.status === 'ROLLED_BACK' ? 'คืนยอดแล้ว' : signedCredits(round.netAmount)}
              </strong>
              {round.canRollback ? (
                <button
                  className={styles.ghostButton}
                  type="button"
                  disabled={busy || Boolean(rollingBack)}
                  onClick={() => void rollback(round)}
                  data-demo-slot-rollback={round.roundId}
                >
                  {rollingBack === round.roundId ? 'กำลังย้อน...' : 'Rollback รอบ'}
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {!loading && rounds.length === 0 ? <p className={styles.empty}>ยังไม่มี BET/WIN ใน GameSession นี้</p> : null}
      </div>
    </section>
  );
}

function statusLabel(round: SlotRound) {
  if (round.status === 'ROLLED_BACK') return '↩ ROLLED BACK';
  if (round.status === 'REFUNDED') return '↩ REFUNDED';
  return round.result === 'WIN' ? '🎉 WIN' : 'LOSS';
}

function readMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.message)) {
    return record.message.filter((item): item is string => typeof item === 'string').join(', ') || fallback;
  }
  if (typeof record.message === 'string' && record.message.trim()) return record.message;
  if (typeof record.error === 'string' && record.error.trim()) return record.error;
  return fallback;
}

function formatCredits(value: string | number) {
  const amount = Number(value);
  return `${Number.isFinite(amount) ? amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} เครดิต`;
}

function signedCredits(value: string | number) {
  const amount = Number(value);
  const sign = amount > 0 ? '+' : '';
  return `${sign}${formatCredits(Number.isFinite(amount) ? amount : 0)}`;
}
