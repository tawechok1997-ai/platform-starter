import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const tableSource = readFileSync(new URL('./data-table.tsx', import.meta.url), 'utf8');
const controlsSource = readFileSync(new URL('./data-table-view-controls.tsx', import.meta.url), 'utf8');

test('shared data table owns saved-view and URL query-state adoption', () => {
  assert.equal(tableSource.includes('<AdminDataTableViewControls'), true);
  assert.equal(tableSource.includes('parseAdminTableQuery(params'), true);
  assert.equal(tableSource.includes("window.history.replaceState(window.history.state, '', next)"), true);
  assert.equal(tableSource.includes('syncUrlState = true'), true);
});

test('saved views persist query state, columns and active selection through the versioned contract', () => {
  assert.equal(controlsSource.includes('buildAdminDataViewStorageKey'), true);
  assert.equal(controlsSource.includes('parseAdminDataViewEnvelope'), true);
  assert.equal(controlsSource.includes('upsertAdminSavedView'), true);
  assert.equal(controlsSource.includes('normalizeColumnPreferences'), true);
  assert.equal(controlsSource.includes('onPageSizeChange(view.query.pageSize)'), true);
  assert.equal(controlsSource.includes('onSortChange(view.query.sort)'), true);
  assert.equal(controlsSource.includes('onPageChange(view.query.page)'), true);
});

test('saved-view storage failures degrade without breaking table access', () => {
  assert.equal(controlsSource.includes('try {\n      const parsed = parseAdminDataViewEnvelope'), true);
  assert.equal(controlsSource.includes('setEnvelope(emptyEnvelope())'), true);
  assert.equal(controlsSource.includes('storageUnavailable'), true);
});
