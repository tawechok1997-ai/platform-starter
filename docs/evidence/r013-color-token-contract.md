# R-013 Shared Color Token Contract

Admin and Member load `packages/design-tokens/colors.css` as the single semantic color source.

Backward-compatible app aliases remain local so existing screens can migrate without an all-at-once visual rewrite.

The contract is enforced by `tools/audit-r013-color-token-contract.mjs` and the R-013 UI System workflow.
