'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { memberApiFetch } from '../../member-api';
import { DemoSlotRoundHistory } from './demo-slot-round-history';
import styles from './demo-slot.module.css';

type WalletPayload = {
  balance?: string;
  lockedBalance?: string;
  currency?: string;
};

type SpinPayload = {
  ok?: boolean;
  spinId?: string;
  roundId?: string;
  result?: 'WIN' | 'LOSS';
  symbols?: string[];
  multiplier?: number;
  betAmount?: string;
  winAmount?: string;
  netAmount?: string;
  balance?: string;
  currency?: string;
  replayed?: boolean;
  message?: string | string[];
  error?: string;
  game?: { code?: string; name?: string; provider?: string };
  transactions?: { bet?: string; win?: string | null };
};

type SpinHistoryItem = {
  spinId: string;
  roundId: string;
  betAmount: string;
  winAmount: string;
};

const QUICK_BETS = [10, 50, 100, 500];
const INITIAL_SYMBOLS = ['🍒', '🔔', '7️⃣'];

export default function DemoLaunchPage() {
  const params = useSearchParams();
  const session = params.get('session')?.trim() ?? '';
  const requestedGame = params.get('game')?.trim() || 'demo-slot-001';
  const provider = params.get('provider')?.trim() || 'Simulator Provider';
  const [wallet, setWallet] = useState<WalletPayload>({});
  const [amount, setAmount] = useState('50');
  const [symbols, setSymbols] = useState<string[]>(INITIAL_SYMBOLS);
  const [sessionHistory, setSessionHistory] = useState<SpinHistoryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('เครดิตเดิมพันและเงินรางวัลจะหักหรือเพิ่มในบัญชีสมาชิกนี้โดยตรง');
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState<SpinPayload | null>(null);

  useEffect(() => {
    void loadWallet();
  }, []);

  const balance = Number(wallet.balance ?? 0);
  const lockedBalance = Number(wallet.lockedBalance ?? 0);
  const numericAmount = Number(amount);
  const canSpin = Boolean(session)
    && Number.isFinite(numericAmount)
    && numericAmount >= 1
    && numericAmount <= 10_000
    && numericAmount <= balance
    && !busy;
  const totalBet = useMemo(
    () => sessionHistory.reduce((sum, item) => sum + Number(item.betAmount), 0),
    [sessionHistory],
  );
  const totalWin = useMemo(
    () => sessionHistory.reduce((sum, item) => sum + Number(item.winAmount), 0),
    [sessionHistory],
  );

  async function loadWallet() {
    try {
      const response = await memberApiFetch('/member/wallet');
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(readMessage(payload, 'โหลดเครดิตสมาชิกไม่สำเร็จ'));
      setWallet(payload?.wallet ?? payload ?? {});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'โหลดเครดิตสมาชิกไม่สำเร็จ');
    }
  }

  async function spin() {
    setError('');
    if (!session) {
      setError('ไม่พบ Game Session กรุณาเปิดเกมผ่านหน้ารวมเกมอีกครั้ง');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount < 1 || numericAmount > 10_000) {
      setError('เดิมพันได้ตั้งแต่ 1 ถึง 10,000 เครดิตต่อรอบ');
      return;
    }
    if (numericAmount > balance) {
      setError('เครดิตในบัญชีไม่พอสำหรับเดิมพันรอบนี้');
      return;
    }

    const spinId = createSpinId();
    setBusy(true);
    setLastResult(null);
    setMessage('กำลังส่ง BET ไปยัง Provider Simulator...');

    try {
      const [response] = await Promise.all([
        memberApiFetch(`/member/provider-simulator/sessions/${encodeURIComponent(session)}/spin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spinId, amount: numericAmount }),
        }),
        wait(650),
      ]);
      const payload = await response.json().catch(() => null) as SpinPayload | null;
      if (!response.ok || !payload?.ok || !payload.roundId || !payload.result) {
        throw new Error(readMessage(payload, 'หมุนสล็อตไม่สำเร็จ'));
      }

      const nextSymbols = Array.isArray(payload.symbols) && payload.symbols.length === 3
        ? payload.symbols
        : INITIAL_SYMBOLS;
      const nextBalance = payload.balance ?? wallet.balance ?? '0.00';
      setSymbols(nextSymbols);
      setLastResult(payload);
      setSessionHistory((current) => [{
        spinId: payload.spinId ?? spinId,
        roundId: payload.roundId ?? `slot_${spinId}`,
        betAmount: payload.betAmount ?? numericAmount.toFixed(2),
        winAmount: payload.winAmount ?? '0.00',
      }, ...current].slice(0, 50));
      setWallet((current) => ({ ...current, balance: nextBalance, currency: payload.currency ?? current.currency }));
      setMessage(
        payload.result === 'WIN'
          ? `ชนะ ${formatCredits(payload.winAmount ?? '0.00')} · WIN ถูกบันทึกเข้ากระเป๋าแล้ว`
          : `แพ้ ${formatCredits(payload.betAmount ?? numericAmount)} · BET ถูกหักจากกระเป๋าแล้ว`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'หมุนสล็อตไม่สำเร็จ');
      setMessage('รอบไม่สำเร็จ ระบบจะไม่เดายอดเงินเอง กรุณาตรวจ Wallet Ledger');
      await loadWallet();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page} data-member-wallet-slot="true">
      <div className={styles.shell}>
        <section className={styles.machine} aria-label="สล็อตจำลองที่ใช้เครดิตบัญชีสมาชิก">
          <header className={styles.header}>
            <div>
              <span className={styles.eyebrow}>
                <i className={styles.onlineDot} aria-hidden="true" /> Provider Simulator
              </span>
              <h1 className={styles.title}>Demo Fortune Slot</h1>
              <p className={styles.subtitle}>
                ทดสอบ BET, WIN, REFUND, ROLLBACK และ Wallet Ledger ด้วยเครดิตบัญชีสมาชิกปัจจุบัน
              </p>
            </div>
            <div className={styles.balanceCard} aria-live="polite">
              <span>เครดิตคงเหลือ</span>
              <strong>{formatCredits(wallet.balance ?? 0)}</strong>
            </div>
          </header>

          <div className={styles.reelFrame}>
            <div className={`${styles.reels} ${busy ? styles.rolling : ''}`} aria-busy={busy}>
              {symbols.map((symbol, index) => (
                <div className={styles.reel} key={`${index}-${symbol}`} aria-label={`รีล ${index + 1}: ${symbol}`}>
                  {busy ? '✦' : symbol}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.resultRow} role="status" aria-live="polite">
            <div>
              <strong className={lastResult?.result === 'WIN' ? styles.resultWin : lastResult ? styles.resultLoss : ''}>
                {busy ? 'กำลังหมุน...' : lastResult?.result === 'WIN' ? 'ชนะรอบนี้' : lastResult ? 'ไม่ถูกรางวัล' : 'พร้อมหมุน'}
              </strong>
              <span className={styles.muted}>{message}</span>
            </div>
            {lastResult ? (
              <strong className={lastResult.result === 'WIN' ? styles.resultWin : styles.resultLoss}>
                {signedCredits(lastResult.netAmount ?? '0.00')}
              </strong>
            ) : null}
          </div>

          {error ? <div className={`${styles.notice} ${styles.error}`} role="alert">{error}</div> : null}
          {!session ? (
            <div className={`${styles.notice} ${styles.error}`} role="alert">
              หน้านี้ต้องเปิดจากเกม Demo ที่สร้าง GameSession แล้ว การเปิด URL ตรงๆ จะไม่ยอมให้หักเครดิต
            </div>
          ) : null}

          <section className={styles.controls} aria-label="ตั้งค่าเดิมพัน">
            <div className={styles.betBox}>
              <label className={styles.betLabel} htmlFor="demo-slot-bet">เดิมพันต่อรอบ</label>
              <input
                id="demo-slot-bet"
                className={styles.betInput}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                min="1"
                max="10000"
                step="0.01"
                disabled={busy}
                aria-describedby="demo-slot-bet-help"
              />
              <div className={styles.quickBets}>
                {QUICK_BETS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={styles.quickButton}
                    aria-pressed={Number(amount) === value}
                    onClick={() => setAmount(String(value))}
                    disabled={busy}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <small id="demo-slot-bet-help" className={styles.muted}>ขั้นต่ำ 1 · สูงสุด 10,000 เครดิต</small>
            </div>
            <button
              type="button"
              className={styles.spinButton}
              onClick={spin}
              disabled={!canSpin}
              data-demo-slot-spin="true"
            >
              {busy ? 'กำลัง SETTLE...' : 'หมุนสล็อต'}
            </button>
          </section>

          <div className={styles.stats}>
            <div className={styles.stat}><span>เดิมพันในหน้าปัจจุบัน</span><strong>{formatCredits(totalBet)}</strong></div>
            <div className={styles.stat}><span>ชนะในหน้าปัจจุบัน</span><strong>{formatCredits(totalWin)}</strong></div>
            <div className={styles.stat}><span>ยอดล็อก</span><strong>{formatCredits(lockedBalance)}</strong></div>
          </div>
        </section>

        <aside className={styles.sidePanel}>
          <section>
            <div className={styles.sectionTitle}>
              <strong>ตารางรางวัล</strong>
              <span className={styles.muted}>คูณจากยอดเดิมพัน</span>
            </div>
            <div className={styles.payTable}>
              <div className={styles.payRow}><span>💎 💎 💎</span><strong>×20</strong></div>
              <div className={styles.payRow}><span>7️⃣ 7️⃣ 7️⃣</span><strong>×10</strong></div>
              <div className={styles.payRow}><span>⭐ ⭐ ⭐</span><strong>×6</strong></div>
              <div className={styles.payRow}><span>🔔 🔔 🔔</span><strong>×4</strong></div>
              <div className={styles.payRow}><span>🍒 / 🍋 สามตัว</span><strong>×2</strong></div>
              <div className={styles.payRow}><span>สัญลักษณ์เหมือนกันสองตัว</span><strong>×1.5</strong></div>
            </div>
          </section>

          <DemoSlotRoundHistory
            sessionId={session}
            busy={busy}
            onBalanceChange={(nextBalance) => setWallet((current) => ({ ...current, balance: nextBalance }))}
          />

          <section>
            <div className={styles.sectionTitle}><strong>Session ตรวจสอบ</strong></div>
            <p className={styles.sessionText}>Game: {requestedGame}</p>
            <p className={styles.sessionText}>Provider: {provider}</p>
            <p className={styles.sessionText}>Session: {session || 'missing'}</p>
          </section>

          <div className={styles.footerActions}>
            <a className={styles.linkButton} href="/games">กลับหน้าเกม</a>
            <button className={styles.ghostButton} type="button" onClick={loadWallet} disabled={busy}>รีเฟรชเครดิต</button>
          </div>
        </aside>
      </div>
    </main>
  );
}

function createSpinId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function readMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  const message = record.message;
  if (Array.isArray(message)) return message.filter((item): item is string => typeof item === 'string').join(', ') || fallback;
  if (typeof message === 'string' && message.trim()) return message;
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

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}
