from pathlib import Path

root = Path(__file__).resolve().parents[2]
path = root / "tests/admin-browser-matrix/admin-route-role-viewport.spec.ts"
content = path.read_text(encoding="utf-8")
old = "  { path: '/users', label: 'Members', ownerOnly: true },"
new = "  { path: '/members', label: 'Members', ownerOnly: true },"
if old not in content:
    raise SystemExit("Expected temporary /users route fixture is missing")
path.write_text(content.replace(old, new, 1), encoding="utf-8")
