from pathlib import Path

root = Path(__file__).resolve().parents[2]
path = root / "apps/web-admin/app/(admin)/operations/operations-redesigned.tsx"
content = path.read_text(encoding="utf-8")
content = content.replace(
    ", tone: 'warning', priority: 60, ageMinutes: oldestAge(aging, 'WITHDRAWAL') },",
    ", tone: 'warning', priority: 60, ...(oldestAge(aging, 'WITHDRAWAL') !== undefined ? { ageMinutes: oldestAge(aging, 'WITHDRAWAL') } : {}) },",
)
content = content.replace(
    ", tone: 'warning', priority: 50, ageMinutes: oldestAge(aging, 'TOPUP') },",
    ", tone: 'warning', priority: 50, ...(oldestAge(aging, 'TOPUP') !== undefined ? { ageMinutes: oldestAge(aging, 'TOPUP') } : {}) },",
)
path.write_text(content, encoding="utf-8")
