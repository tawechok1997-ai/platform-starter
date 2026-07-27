from pathlib import Path

root = Path(__file__).resolve().parents[2]
path = root / "tests/admin-browser-matrix/admin-route-role-viewport.spec.ts"
content = path.read_text(encoding="utf-8")
old_route = "  { path: '/users', label: 'Members', ownerOnly: true },"
new_route = "  { path: '/members', label: 'Members', ownerOnly: true },"
if old_route not in content:
    raise SystemExit("Expected temporary /users route fixture is missing")
content = content.replace(old_route, new_route, 1)

old_aging = "if (path.startsWith('/admin/reports/queue-aging')) return { oldest: [{ type: 'TOPUP', ageMinutes: 48 }, { type: 'WITHDRAWAL', ageMinutes: 132 }] };"
new_aging = "if (path.startsWith('/admin/reports/queue-aging')) return { summary: { pendingTopUps: 4, pendingWithdrawals: 2, oldestAgeMinutes: 132, over15Minutes: 6, over60Minutes: 1, over24Hours: 0 }, oldest: [{ id: 'topup-1', type: 'TOPUP', userId: 'member-1', username: 'matrix_member', amount: '2500', currency: 'THB', createdAt: new Date(Date.now() - 48 * 60_000).toISOString(), ageMinutes: 48, ageLabel: '48 นาที' }, { id: 'withdrawal-1', type: 'WITHDRAWAL', userId: 'member-2', username: 'matrix_owner', amount: '1200', currency: 'THB', createdAt: new Date(Date.now() - 132 * 60_000).toISOString(), ageMinutes: 132, ageLabel: '2 ชม. 12 นาที' }], generatedAt: new Date().toISOString() };"
if old_aging not in content:
    raise SystemExit("Expected queue-aging fixture is missing")
content = content.replace(old_aging, new_aging, 1)

anchor = "  if (path.startsWith('/admin/finance/summary')) {"
report_fixtures = """  if (path.startsWith('/admin/reports/daily')) return { range: { from: '2026-07-20', to: '2026-07-27' }, topUps: [{ status: 'COMPLETED', count: 12, amount: '25000' }], withdrawals: [{ status: 'COMPLETED', count: 7, amount: '9800' }], adjustments: [], wallets: { count: 42, totalBalance: '125000', totalLockedBalance: '3500' }, ledgers: { count: 58, amount: '34800' }, pendingQueues: { topUps: { count: 4, amount: '5600' }, withdrawals: { count: 2, amount: '3200' } }, generatedAt: new Date().toISOString() };
  if (path.startsWith('/admin/reports/reconciliation')) return { checkedCount: 42, mismatchCount: 1, items: [{ walletId: 'wallet-1', shortUserId: 'member-1', username: 'matrix_member', actualBalance: '1250', latestLedgerBalance: '1200', lockedBalance: '0', availableBalance: '1250', status: 'MISMATCH' }], generatedAt: new Date().toISOString() };
  if (path.startsWith('/admin/reports/trends')) return { range: { days: 7, from: '2026-07-21', to: '2026-07-27' }, totals: { topUpAmount: '25000', topUpCount: 12, withdrawalAmount: '9800', withdrawalCount: 7, netFlow: '15200' }, daily: [{ date: '2026-07-27', topUpAmount: '5000', topUpCount: 3, withdrawalAmount: '1800', withdrawalCount: 1, netFlow: '3200' }], generatedAt: new Date().toISOString() };
"""
if report_fixtures.strip() not in content:
    if anchor not in content:
        raise SystemExit("Finance fixture anchor is missing")
    content = content.replace(anchor, report_fixtures + anchor, 1)

path.write_text(content, encoding="utf-8")
