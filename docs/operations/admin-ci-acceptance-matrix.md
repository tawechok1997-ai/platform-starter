# Admin CI Acceptance Matrix

Updated: 2026-07-21  
Scope: PR #101, branch `agent/admin-modernization-batch-1`

## Purpose

Map each remaining Admin modernization checkbox to the exact CI or browser evidence required before it may be marked complete.

## Code implementation status

The Admin-only code implementation work is complete for this batch. The protected-shell primitive family owns native button and link behavior through one class-composition contract with forwarded refs. The richer route primitive family remains as the route compatibility facade because its API includes page, metric, toolbar, pagination and confirm-dialog behavior that the shell does not expose.

No compatibility CSS is removed in this batch. Removal remains evidence-gated and is not required to close the code consolidation item.

## CI acceptance matrix

| Checklist item | Required workflow or command | Passing evidence required | Ignore when unrelated |
| --- | --- | --- | --- |
| Run Admin lint, test, typecheck, build and bundle analysis | `P5 Web Unit Tests`, `R005 Shared API Client`, `Quality Gate`, plus `pnpm --filter @platform/web-admin analyze` | Admin critical tests pass; Admin typecheck passes; Admin build passes; Admin lint passes; analyzer build completes | API tests, Prisma drift, Member failures, withdrawal contracts and repository-wide architecture failures that do not originate from Admin files |
| Record baseline route chunks and largest client bundles | `pnpm --filter @platform/web-admin analyze` and its analyzer output/artifact | Route chunk table, initial JS totals and largest client chunks recorded from the same final branch head; values compared with `apps/web-admin/performance-budget.json` | Repository-wide bundle data unrelated to `apps/web-admin` |
| Loading, error and not-found browser evidence | Verified Admin build deployed or run locally | Screenshots and interaction notes for `loading.tsx`, `error.tsx` retry/fallback and `not-found.tsx` | CI success alone does not close this item |
| Six-viewport visual evidence | Visual regression workflow or manual browser capture | Admin routes captured at 360, 390, 768, 1024, 1280 and 1440 CSS pixels with no blocking regressions | A single desktop screenshot is insufficient |
| Keyboard, focus, zoom, reduced motion and axe evidence | Browser accessibility run against verified build | Keyboard navigation; dialog focus entry/restoration; 200% zoom; reduced-motion behavior; no critical axe violations | Unit tests alone are insufficient |
| Authenticated console/network failure gates | Browser run while authenticated | No unexplained console errors; failed/slow API states show safe UI; session and permission failures do not expose stale protected data | Unrelated backend test failures do not close or block this item unless they affect the Admin flow being tested |

## Workflow interpretation

### Must be green for the Admin verification checkbox

1. `P5 Web Unit Tests`
   - Required step: `Test Admin critical components`.
2. `R005 Shared API Client`
   - Required step: `Typecheck Admin Web`.
3. `Quality Gate`
   - Required Admin job: `build (web-admin)`.
   - Required Admin lint evidence must also be present either here or in the repository quality workflow.
4. Admin analyzer command
   - Required command: `pnpm --filter @platform/web-admin analyze`.

### Useful but not sufficient by themselves

- `R-013 Visual Regression`: useful for visual evidence, but it does not prove Admin lint, typecheck or component tests.
- `P5 Security Audit`: useful security evidence, but it does not prove the remaining UI and bundle checkboxes.

### Failures that should be triaged separately

Do not keep the Admin checklist open solely because these unrelated scopes fail:

- API unit or integration tests;
- Prisma generated-client drift;
- Member build or tests;
- withdrawal transaction ownership checks;
- repository architecture inventory failures unrelated to the Admin diff.

If an allegedly unrelated failure names a changed Admin file or blocks the Admin build, treat it as Admin-owned and investigate it before marking the checkbox complete.

## Final acceptance order

1. Use one final branch head after all code changes.
2. Run the Admin verification commands together.
3. Record analyzer and route-chunk output from that same head.
4. Capture browser, visual and accessibility evidence from the verified build.
5. Update `admin-modernization-batch-1.md` only after the corresponding evidence exists.
