# Endpoint Ownership Matrix

Last updated: 2026-07-13

This matrix documents the current owner module for overlapping API areas so future route migrations can be backward-compatible and avoid duplicate source-of-truth logic.

| Area | Current owner | Primary routes | Notes |
| --- | --- | --- | --- |
| Admin activity timeline | `activity` | `/admin/activity/timeline` | Aggregates audit logs, ledgers, topups, and withdrawals for operational timelines. |
| Admin audit logs | `admin-audit` / access-related services | `/admin/audit`, module-specific audit writes | Audit log writes stay inside the mutating service; read/report UX should not mutate audit data. |
| Finance dashboard/reports | `finance`, `reports`, `exports` | `/admin/finance/*`, `/admin/reports/*`, `/admin/exports/*.csv` | `reports` owns aggregates; `exports` owns CSV rendering; finance pages consume both. |
| Money operations | `topups`, `withdrawals`, `wallets`, `money-ops` | `/admin/topups`, `/admin/withdrawals`, `/admin/wallets`, `/admin/money-ops` | Workflow actions should stay in workflow services, not dashboard/report controllers. |
| Risk alerts | `risk-alerts` | `/admin/risk-alerts/*` | Persistent alert lifecycle, notes, assignment, bulk dismiss, and auto-close suggestions. |
| Risk summary | `risk` | `/admin/risk/summary` | Read-only aggregate risk snapshot; should not own alert state transitions. |
| Member wallet ledger | `wallets` / ledger services | `/member/wallet/ledger`, admin ledger pages | Ledger is the financial source-of-truth for balance history. |
| Settings/CMS | `settings` + admin content center | `/admin/settings/*`, `/public/site-settings` | Settings owns persistence/public exposure; Content Center edits `features.cms_content`. |
| Promotion/affiliate temporary ledgers | `promotions`, `affiliates` | `/member/promotions`, `/admin/promotion-claims`, `/admin/bonus-ledgers`, `/admin/affiliate-*`, `/admin/commission-ledgers` | Currently backed by `RiskAlert` metadata; R-003 must split dedicated domain models before real-money settlement. |
