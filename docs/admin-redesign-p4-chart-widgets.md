# Admin Redesign P4: Chart and Widget System

## สถานะปัจจุบัน

- PR: `#552`
- Final branch: `rebuild/admin-phase-4-chart-widgets-20260804`
- สถานะ: **Merged**
- Main merge commit: `d7fe012d85a772fa78d7b0bc540b7d9a01746850`
- Supersedes PR `#496` ซึ่งล้าหลัง `main`

## Shared chart system

- Chart kinds: bar, stacked bar, line, area และ donut
- Date presets และ custom date ranges
- Comparison กับช่วงก่อนหน้าและปีก่อน
- Loading, empty, error และ partial-data states
- Keyboard activation และ drill-down
- Fullscreen และ Escape handling
- CSV และ PNG export
- Preserve computed SVG styles ระหว่าง PNG rendering
- High contrast และ reduced motion

## Widget system

- Typed widget registry
- ป้องกัน widget ID ซ้ำหรือไม่ถูกต้อง
- Permission-aware visibility
- P3 workspace-aware visibility
- Drag และ keyboard move
- Resize
- Pin
- Hide/show
- Restore default
- Versioned per-admin browser layout
- Cross-tab synchronization
- Desktop, Tablet, Mobile และ compact density

## Dashboard adoption

`/dashboard` route ผ่าน `dashboard-widgetized.tsx`

Widgets หลัก:

1. Priority work
2. Cash flow
3. Wallet composition
4. Risk severity
5. Pending queues
6. Recent activity

กฎข้อมูล:

- โหลด Admin identity และ effective permissions ก่อน data source ที่ผูกสิทธิ์
- เรียก Finance/Risk API เฉพาะเมื่อผู้ใช้มีสิทธิ์ที่จำเป็น
- Combined widget กรองข้อมูลด้วย granular permission
- Widget set ตาม P3 workspace selection
- ไม่สร้าง storage owner หรือ workspace switcher ซ้ำ
- Loading, empty, error และ partial data ต้องแยกสถานะชัดเจน ห้ามสร้าง KPI หลอกเมื่อไม่มีข้อมูลจริง

## Owners

| ความสามารถ | Owner |
|---|---|
| Chart rendering | `admin-chart.tsx` |
| Widget frame/actions | `admin-widget.tsx` |
| Widget workspace/layout editing | `admin-widget-workspace.tsx` |
| Saved layout runtime | `use-admin-widget-layout.ts` |
| Registry and visibility | `chart-widget-contracts.ts` |
| Dashboard registry | `admin-dashboard-widget-registry.ts` |
| CSV/PNG export | `chart-export.ts` |
| Dashboard data adoption | `dashboard-widgetized.tsx` |

## Current data contracts

Backend reporting on current `main` includes permission-guarded Admin dashboard finance trends and explicit date-range validation. Custom `from`/`to` ranges require both values and are capped by the report-range owner. Historical availability is a data-source concern; the UI must present `partial` or `empty` rather than manufacture a complete time series.

Saved widget layouts remain per-admin browser state unless a backend preference owner is explicitly adopted. Do not invent a second storage owner inside individual widgets.

## Final verification

PR #552 passed its required Build, Typecheck, Admin tests, Browser Matrix, Visual/UI and repository gates before merge. Current work must start from `main`, not the superseded P4 branch.

Canonical cross-domain handoff: `docs/admin-operations-handoff.md`.
