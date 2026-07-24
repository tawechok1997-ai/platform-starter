import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const hookSource = readFileSync(path.join(process.cwd(), 'app/(admin)/settings/use-admin-settings-form.ts'), 'utf8');
const maintenanceSource = readFileSync(path.join(process.cwd(), 'app/(admin)/settings/maintenance/maintenance-settings-client.tsx'), 'utf8');

test('settings hook uses latest-request-wins and blocks duplicate saves', () => {
  assert.equal(hookSource.includes('const loadRequestRef = useRef(0)'), true);
  assert.equal(hookSource.includes('const saveInFlightRef = useRef(false)'), true);
  assert.equal(hookSource.includes('loadRequestRef.current !== requestId'), true);
  assert.equal(hookSource.includes('if (saveInFlightRef.current) return false'), true);
});

test('settings hook does not expose raw backend messages', () => {
  assert.equal(hookSource.includes('data?.message'), false);
  assert.equal(hookSource.includes('payload?.message'), false);
  assert.equal(hookSource.includes('โหลดการตั้งค่าไม่สำเร็จ กรุณาลองใหม่'), true);
  assert.equal(hookSource.includes('บันทึกการตั้งค่าไม่สำเร็จ กรุณาตรวจข้อมูลแล้วลองใหม่'), true);
});

test('settings hook adopts normalized API settings after save', () => {
  assert.equal(hookSource.includes('isRecord(payload.settings)'), true);
  assert.equal(hookSource.includes('setForm(normalized)'), true);
  assert.equal(hookSource.includes('setInitialForm(normalized)'), true);
});

test('maintenance mode validates dangerous combinations before save', () => {
  assert.equal(maintenanceSource.includes('form.super_admin_only && !form.allow_admin_access'), true);
  assert.equal(maintenanceSource.includes('start.getTime() >= end.getTime()'), true);
  assert.equal(maintenanceSource.includes('form.message.trim().length < 5'), true);
});

test('maintenance mode requires shared confirmation and impact review', () => {
  assert.equal(maintenanceSource.includes('AdminConfirmDialog'), true);
  assert.equal(maintenanceSource.includes('ผลกระทบก่อนบันทึก'), true);
  assert.equal(maintenanceSource.includes('ยืนยันเปิดโหมดปิดปรับปรุง'), true);
  assert.equal(maintenanceSource.includes('onConfirm={() => void confirmSave()}'), true);
});
