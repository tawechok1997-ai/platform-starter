from pathlib import Path

root = Path(__file__).resolve().parents[2]
path = root / "apps/web-admin/app/(admin)/operations/operations-redesigned.tsx"
content = path.read_text(encoding="utf-8")
content = content.replace(
    "    const pendingWithdrawals = Number(queues.withdrawals?.count ?? 0);\n    const candidates: Task[] = [",
    "    const pendingWithdrawals = Number(queues.withdrawals?.count ?? 0);\n    const withdrawalAge = oldestAge(aging, 'WITHDRAWAL');\n    const depositAge = oldestAge(aging, 'TOPUP');\n    const candidates: Task[] = [",
)
content = content.replace(
    ", tone: 'warning', priority: 60, ageMinutes: oldestAge(aging, 'WITHDRAWAL') },",
    ", tone: 'warning', priority: 60, ...(withdrawalAge === undefined ? {} : { ageMinutes: withdrawalAge }) },",
)
content = content.replace(
    ", tone: 'warning', priority: 50, ageMinutes: oldestAge(aging, 'TOPUP') },",
    ", tone: 'warning', priority: 50, ...(depositAge === undefined ? {} : { ageMinutes: depositAge }) },",
)
path.write_text(content, encoding="utf-8")
