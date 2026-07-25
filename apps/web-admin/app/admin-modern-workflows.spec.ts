import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const layout = readFileSync(path.join(appRoot, 'layout.tsx'), 'utf8');
const bridge = readFileSync(path.join(appRoot, 'admin-modern-token-bridge.css'), 'utf8');
const workflows = readFileSync(path.join(appRoot, 'admin-modern-workflows.css'), 'utf8');

test('bridges all legacy Admin tokens into the modern system', () => {
  for (const token of [
    '--admin-bg: var(--admin-modern-bg)',
    '--admin-surface: var(--admin-modern-surface)',
    '--admin-border: var(--admin-modern-border)',
    '--admin-text: var(--admin-modern-text)',
    '--admin-brand: var(--admin-modern-brand)',
    '--admin-success: var(--admin-modern-success)',
    '--admin-warning: var(--admin-modern-warning)',
    '--admin-danger: var(--admin-modern-danger)',
  ]) assert.equal(bridge.includes(token), true, `${token} must remain bridged`);
});

test('loads workflow polish after the modern token bridge', () => {
  const bridgeIndex = layout.indexOf("import './admin-modern-token-bridge.css';");
  const workflowIndex = layout.indexOf("import './admin-modern-workflows.css';");
  assert.notEqual(bridgeIndex, -1);
  assert.notEqual(workflowIndex, -1);
  assert.equal(workflowIndex > bridgeIndex, true);
});

test('covers wallet history, detail, statement, reconciliation and analytics', () => {
  for (const selector of [
    '.admin-wallet-history',
    '.admin-wallet-detail',
    '.admin-reconciliation-center',
    '.admin-wallet-statement',
    '.admin-wallet-analytics',
    '.admin-wallet-analytics__chart',
  ]) assert.equal(workflows.includes(selector), true, `${selector} must remain styled`);
});

test('covers member directory and member insight charts', () => {
  for (const selector of [
    '.admin-directory-toolbar',
    '.admin-directory-card',
    '.admin-directory-avatar',
    '.admin-directory-facts',
    '.admin-member-insights__chart',
    '.admin-member-insights__bar',
  ]) assert.equal(workflows.includes(selector), true, `${selector} must remain styled`);
});

test('covers support threads and responsive workflows', () => {
  assert.equal(workflows.includes('.admin-support-message-box'), true);
  assert.equal(workflows.includes('.admin-support-thread'), true);
  assert.equal(workflows.includes('.admin-support-reply'), true);
  assert.equal(workflows.includes('@media (max-width: 720px)'), true);
  assert.equal(workflows.includes('@media (max-width: 430px)'), true);
  assert.equal(workflows.includes('env(safe-area-inset-bottom)'), false);
});

test('keeps chart motion accessible', () => {
  assert.equal(workflows.includes('@keyframes admin-workflow-bar'), true);
  assert.equal(workflows.includes('@media (prefers-reduced-motion: reduce)'), true);
  assert.equal(workflows.includes('animation-duration: .01ms !important'), true);
});
