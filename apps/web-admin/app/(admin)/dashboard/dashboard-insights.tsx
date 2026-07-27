'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { formatMoney } from '../_components/admin-ui';
import { useAdminLocale } from '../admin-locale';
import styles from './dashboard-insights.module.css';

type FinanceSummary = {
  totals: {
    totalBalance: string;
    totalAvailableBalance: string;
    totalLockedBalance: string;
  };
  today?: {
    topUpAmount: string;
    topUpCount: number;
    withdrawalAmount: string;
    withdrawalCount: number;
    netFlow: string;
  };
};

type RiskAlert = {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
};

type RiskResponse = {
  items?: RiskAlert[];
  summary?: { openCount?: number; criticalCount?: number };
};

const severities: RiskAlert['severity'][] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export default function DashboardInsights() {
  const [locale] = useAdminLocale();
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const copy = locale === 'th'
    ? {
      eyebrow: 'ข้อมูลสำคัญ', title: 'ภาพวิเคราะห์', description: 'กราฟการเงิน กระเป๋าเงิน และความเสี่ยงสำหรับตัดสินใจ',
      finance: 'ฝากเทียบถอนวันนี้', deposit: 'ฝาก', withdrawal: 'ถอน', net: 'เงินสุทธิ', items: 'รายการ',
      wallet: 'องค์ประกอบยอดกระเป๋า', available: 'ใช้ได้', locked: 'ล็อก', variance: 'ส่วนต่าง', total: 'ยอดรวม',
      risk: 'ระดับความเสี่ยงที่เปิดอยู่', noRisk: 'ไม่มีความเสี่ยงเปิดอยู่', open: 'เปิดอยู่',
      critical: 'วิกฤต', high: 'สูง', medium: 'กลาง', low: 'ต่ำ', loading: 'กำลังโหลดกราฟ',
    }
    : {
      eyebrow: 'Key data', title: 'Operational insights', description: 'Finance, wallet, and risk charts for decision making',
      finance: 'Deposits vs withdrawals today', deposit: 'Deposits', withdrawal: 'Withdrawals', net: 'Net flow', items: 'items',
      wallet: 'Wallet balance composition', available: 'Available', locked: 'Locked', variance: 'Variance', total: 'Total',
      risk: 'Open risk severity', noRisk: 'No open risks', open: 'open',
      critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', loading: 'Loading charts',
    };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [financeResponse, riskResponse] = await Promise.all([
          adminApiFetch('/admin/finance/summary'),
          adminApiFetch('/admin/risk-alerts?status=OPEN'),
        ]);
        const [financeData, riskData] = await Promise.all([
          financeResponse.json().catch(() => null) as Promise<FinanceSummary | null>,
          riskResponse.json().catch(() => null) as Promise<RiskResponse | null>,
        ]);
        if (cancelled) return;
        if (financeResponse.ok) setFinance(financeData);
        if (riskResponse.ok) setRisk(riskData);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const metrics = useMemo(() => {
    const deposit = Math.max(0, Number(finance?.today?.topUpAmount ?? 0));
    const withdrawal = Math.max(0, Number(finance?.today?.withdrawalAmount ?? 0));
    const net = Number(finance?.today?.netFlow ?? deposit - withdrawal);
    const maxFlow = Math.max(deposit, withdrawal, 1);

    const total = Math.max(0, Number(finance?.totals.totalBalance ?? 0));
    const available = Math.max(0, Number(finance?.totals.totalAvailableBalance ?? 0));
    const locked = Math.max(0, Number(finance?.totals.totalLockedBalance ?? 0));
    const variance = total - available - locked;
    const walletBase = Math.max(total, available + locked + Math.max(variance, 0), 1);

    const riskCounts = severities.reduce<Record<RiskAlert['severity'], number>>((result, severity) => {
      result[severity] = (risk?.items ?? []).filter((item) => item.severity === severity).length;
      return result;
    }, { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 });
    if (riskCounts.CRITICAL === 0 && Number(risk?.summary?.criticalCount ?? 0) > 0) {
      riskCounts.CRITICAL = Number(risk?.summary?.criticalCount ?? 0);
    }
    const itemTotal = severities.reduce((sum, severity) => sum + riskCounts[severity], 0);
    const openTotal = Math.max(itemTotal, Number(risk?.summary?.openCount ?? 0));
    const donutTotal = Math.max(itemTotal, 1);
    const criticalEnd = (riskCounts.CRITICAL / donutTotal) * 100;
    const highEnd = criticalEnd + (riskCounts.HIGH / donutTotal) * 100;
    const mediumEnd = highEnd + (riskCounts.MEDIUM / donutTotal) * 100;
    const donut = itemTotal === 0
      ? 'conic-gradient(rgb(148 163 184 / 16%) 0 100%)'
      : `conic-gradient(#fb7185 0 ${criticalEnd}%, #f59e0b ${criticalEnd}% ${highEnd}%, #facc15 ${highEnd}% ${mediumEnd}%, #2dd4bf ${mediumEnd}% 100%)`;

    return {
      deposit, withdrawal, net, maxFlow,
      total, available, locked, variance, walletBase,
      riskCounts, openTotal, donut,
    };
  }, [finance, risk]);

  if (loading) {
    return <section className={styles.loading} aria-label={copy.loading}><i /><i /><i /></section>;
  }
  if (!finance && !risk) return null;

  return (
    <section className={styles.insights} aria-label={copy.title}>
      <header className={styles.heading}>
        <div><span>{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.description}</p></div>
      </header>
      <div className={styles.grid}>
        {finance && (
          <article className={styles.card}>
            <header><div><h3>{copy.finance}</h3><p>{copy.net}: <strong data-tone={metrics.net < 0 ? 'danger' : 'success'}>{formatMoney(String(metrics.net))}</strong></p></div></header>
            <div className={styles.flowChart}>
              <FlowBar label={copy.deposit} value={metrics.deposit} count={finance.today?.topUpCount ?? 0} max={metrics.maxFlow} tone="deposit" items={copy.items} />
              <FlowBar label={copy.withdrawal} value={metrics.withdrawal} count={finance.today?.withdrawalCount ?? 0} max={metrics.maxFlow} tone="withdrawal" items={copy.items} />
            </div>
          </article>
        )}

        {finance && (
          <article className={styles.card}>
            <header><div><h3>{copy.wallet}</h3><p>{copy.total}: <strong>{formatMoney(String(metrics.total))}</strong></p></div></header>
            <div className={styles.walletBar} aria-label={copy.wallet}>
              <span data-tone="available" style={{ width: `${Math.max((metrics.available / metrics.walletBase) * 100, metrics.available > 0 ? 2 : 0)}%` }} />
              <span data-tone="locked" style={{ width: `${Math.max((metrics.locked / metrics.walletBase) * 100, metrics.locked > 0 ? 2 : 0)}%` }} />
              {metrics.variance > 0 && <span data-tone="variance" style={{ width: `${Math.max((metrics.variance / metrics.walletBase) * 100, 2)}%` }} />}
            </div>
            <div className={styles.walletLegend}>
              <Metric label={copy.available} value={metrics.available} tone="available" />
              <Metric label={copy.locked} value={metrics.locked} tone="locked" />
              <Metric label={copy.variance} value={metrics.variance} tone={metrics.variance === 0 ? 'available' : 'variance'} />
            </div>
          </article>
        )}

        {risk && (
          <article className={styles.card}>
            <header><div><h3>{copy.risk}</h3><p>{metrics.openTotal.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')} {copy.open}</p></div></header>
            <div className={styles.riskLayout}>
              <div className={styles.donut} style={{ background: metrics.donut }}><span>{metrics.openTotal}</span><small>{copy.open}</small></div>
              <div className={styles.riskLegend}>
                <RiskMetric label={copy.critical} value={metrics.riskCounts.CRITICAL} tone="critical" />
                <RiskMetric label={copy.high} value={metrics.riskCounts.HIGH} tone="high" />
                <RiskMetric label={copy.medium} value={metrics.riskCounts.MEDIUM} tone="medium" />
                <RiskMetric label={copy.low} value={metrics.riskCounts.LOW} tone="low" />
              </div>
            </div>
            {metrics.openTotal === 0 && <p className={styles.empty}>{copy.noRisk}</p>}
          </article>
        )}
      </div>
    </section>
  );
}

function FlowBar({ label, value, count, max, tone, items }: { label: string; value: number; count: number; max: number; tone: 'deposit' | 'withdrawal'; items: string }) {
  const width = value > 0 ? Math.max((value / max) * 100, 3) : 0;
  return <div className={styles.flowRow} data-tone={tone}><div><strong>{label}</strong><span>{formatMoney(String(value))}</span></div><div className={styles.track}><i style={{ width: `${width}%` }} /></div><small>{count.toLocaleString()} {items}</small></div>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className={styles.metric} data-tone={tone}><span>{label}</span><strong>{formatMoney(String(value))}</strong></div>;
}

function RiskMetric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className={styles.riskMetric} data-tone={tone}><i /><span>{label}</span><strong>{value.toLocaleString()}</strong></div>;
}
