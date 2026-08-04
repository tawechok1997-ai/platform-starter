# Admin Redesign P4: Chart and Widget System

## Pull request

- Branch: `rebuild/admin-phase-4-chart-widgets-20260804`
- Base: `main` หลัง P2 Merge (`666955e2e509d2f8a0f499153479b3d6aea676af`)
- Supersedes: PR `#496` ซึ่งล้าหลัง `main` ประมาณ 300 commits
- สถานะ: Draft ระหว่างปิด CI และ Browser verification

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
- Combined widget กรองข้อมูลซ้ำด้วย granular permission
- Widget set ตาม P3 workspace selection
- ไม่สร้าง storage owner หรือ workspace switcher ซ้ำ

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

## Tests

- Registry, permission, workspace และ layout contracts
- Date range และ comparison contracts
- CSV/PNG export unit tests
- Dashboard adoption source contracts
- Browser Matrix สำหรับ:
  - CSV/PNG download
  - Fullscreen/Escape
  - Layout persistence
  - Hide/restore
  - Responsive overflow
  - RBAC
  - P3 workspace switching

## Known limitations

- Finance summary ปัจจุบันเป็น latest snapshot ไม่ใช่ historical aggregate เต็มรูปแบบ
- ช่วงที่ไม่ใช่วันนี้จะแสดงสถานะ Partial เมื่อ API ไม่มี time-series ครบ
- Saved layouts ยังเป็น per-user browser storage และไม่ sync ข้ามอุปกรณ์ผ่าน Backend

## Merge gates

- Build
- Typecheck
- Admin unit/source tests
- Admin Verification & Bundle
- Admin Browser Regression Matrix
- Visual Regression
- UI System
- Security และ Quality gates
- Full-System Automated Tests
