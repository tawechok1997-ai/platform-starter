# R-013 Shared Spacing, Radius, and Shadow Contract

Admin and Member load one shared CSS source: `packages/design-tokens/shape-space-shadow.css`.

The contract defines spacing scale, control/card/pill radii, card/drawer/overlay shadows, and a brand focus ring. Existing `--radius` and `--shadow` variables remain compatibility aliases while screens migrate incrementally.

Automated enforcement: `tools/audit-r013-shape-space-shadow-contract.mjs` in `.github/workflows/r013-ui-system.yml`.
