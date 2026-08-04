import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADMIN_DESIGN_SYSTEM_OWNERS,
  ADMIN_P7_MIGRATED_ROUTES,
  hasVersionedOwnerName,
  resolveAdminDesignSystemOwner,
  validateAdminDesignSystemOwners,
} from './design-system-ownership';

test('P7 has one owner for every shared Admin capability', () => {
  assert.deepEqual(validateAdminDesignSystemOwners(), []);
  assert.equal(new Set(ADMIN_DESIGN_SYSTEM_OWNERS.map((owner) => owner.capability)).size, ADMIN_DESIGN_SYSTEM_OWNERS.length);
});

test('table drawer form and save bar resolve to central owners', () => {
  assert.equal(resolveAdminDesignSystemOwner('table')?.exportName, 'AdminDataTable');
  assert.equal(resolveAdminDesignSystemOwner('drawer')?.exportName, 'AdminDrawer');
  assert.equal(resolveAdminDesignSystemOwner('form-field')?.exportName, 'AdminFormField');
  assert.equal(resolveAdminDesignSystemOwner('save-bar')?.exportName, 'AdminSaveBar');
});

test('versioned replacement names are rejected', () => {
  assert.equal(hasVersionedOwnerName('components/final-v2/card.tsx'), true);
  assert.equal(hasVersionedOwnerName('new-new-table'), true);
  assert.equal(hasVersionedOwnerName('admin-data-table.tsx'), false);
});

test('P7 migration inventory includes settings and core governance routes', () => {
  for (const route of ['/settings', '/system-settings', '/admin-accounts', '/admin-roles']) {
    assert.equal(ADMIN_P7_MIGRATED_ROUTES.includes(route as never), true, `${route} must be tracked`);
  }
});

test('duplicate capability and alias owners fail validation', () => {
  const duplicate = [
    ...ADMIN_DESIGN_SYSTEM_OWNERS,
    {
      capability: 'table' as const,
      modulePath: 'apps/web-admin/app/final-v2-table.tsx',
      exportName: 'FinalTable',
      legacyAliases: ['detail-drawer'],
    },
  ];
  const errors = validateAdminDesignSystemOwners(duplicate);
  assert.equal(errors.some((error) => error.includes('duplicate capability owner: table')), true);
  assert.equal(errors.some((error) => error.includes('versioned owner name')), true);
  assert.equal(errors.some((error) => error.includes('legacy alias collision: detail-drawer')), true);
});
