# Member UI governance index

Use these documents together when implementing or reviewing Member UX/UI work:

- [`MEMBER_UX_UI_TOOLING.md`](./MEMBER_UX_UI_TOOLING.md): source-of-truth worklist
- [`MEMBER_COMPONENT_OWNERSHIP.md`](./MEMBER_COMPONENT_OWNERSHIP.md): component and style ownership
- [`adr/ADR-021-member-ui-tooling-governance.md`](./adr/ADR-021-member-ui-tooling-governance.md): dependency decisions
- [`evidence/member-foundation-audit-2026-07-22.md`](./evidence/member-foundation-audit-2026-07-22.md): foundation audit and migration rules
- [`evidence/member-worklist-batch-2026-07-22.md`](./evidence/member-worklist-batch-2026-07-22.md): evidence and scope for the current batch

## Review order

1. Confirm ownership and canonical component family.
2. Confirm the worklist item and acceptance evidence.
3. Avoid introducing a parallel component, state layer, icon family, design system or E2E runner.
4. Keep each implementation PR bounded and independently revertible.
5. Require stronger evidence for money, identity and session behavior.
