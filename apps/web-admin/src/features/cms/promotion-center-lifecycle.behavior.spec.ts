import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('./promotion-center-page.tsx', import.meta.url), 'utf8');

function extractFunction(name: string): string {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing ${name} in production source`);

  const bodyStart = source.indexOf('{', start);
  assert.notEqual(bodyStart, -1, `missing ${name} body`);

  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const character = source[index];
    if (character === '{') depth += 1;
    if (character === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  throw new Error(`unterminated ${name} body`);
}

function loadNormalizeCampaigns() {
  const moduleSource = `
    type PromotionLifecycle = 'draft' | 'published' | 'archived';
    type PromotionCampaign = Record<string, unknown>;
    const defaultCampaigns: PromotionCampaign[] = [];
    ${extractFunction('normalizeCampaigns')}
    ${extractFunction('slug')}
    export { normalizeCampaigns };
  `;
  const transpiled = ts.transpileModule(moduleSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      strict: true,
    },
  }).outputText;
  const module = { exports: {} as Record<string, unknown> };
  new Function('module', 'exports', transpiled)(module, module.exports);
  return module.exports.normalizeCampaigns as (value: unknown) => Array<Record<string, unknown>>;
}

test('legacy enabled campaign loads as published and remains member-visible after round trip', () => {
  const normalizeCampaigns = loadNormalizeCampaigns();
  const legacy = [{
    id: 'WELCOME',
    title: 'Welcome',
    description: 'Legacy campaign',
    enabled: true,
    bonusType: 'percent',
    bonusValue: 10,
    minDeposit: 100,
    maxBonus: 500,
    turnoverMultiplier: 3,
  }];

  const loaded = normalizeCampaigns(legacy);
  assert.equal(loaded[0]?.id, 'welcome');
  assert.equal(loaded[0]?.lifecycle, 'published');
  assert.equal(loaded[0]?.enabled, true);

  const reloaded = normalizeCampaigns(JSON.parse(JSON.stringify(loaded)));
  assert.equal(reloaded[0]?.lifecycle, 'published');
  assert.equal(reloaded[0]?.enabled, true);
});

test('archived lifecycle always disables member visibility after round trip', () => {
  const normalizeCampaigns = loadNormalizeCampaigns();
  const loaded = normalizeCampaigns([{
    id: 'old-offer',
    title: 'Old offer',
    description: 'Archived campaign',
    lifecycle: 'archived',
    enabled: true,
    turnoverMultiplier: 1,
  }]);

  assert.equal(loaded[0]?.lifecycle, 'archived');
  assert.equal(loaded[0]?.enabled, false);

  const reloaded = normalizeCampaigns(JSON.parse(JSON.stringify(loaded)));
  assert.equal(reloaded[0]?.lifecycle, 'archived');
  assert.equal(reloaded[0]?.enabled, false);
});

test('disabled legacy campaign remains draft after round trip', () => {
  const normalizeCampaigns = loadNormalizeCampaigns();
  const loaded = normalizeCampaigns([{
    id: 'draft-offer',
    title: 'Draft offer',
    description: '',
    enabled: false,
  }]);

  assert.equal(loaded[0]?.lifecycle, 'draft');
  assert.equal(loaded[0]?.enabled, false);

  const reloaded = normalizeCampaigns(JSON.parse(JSON.stringify(loaded)));
  assert.equal(reloaded[0]?.lifecycle, 'draft');
  assert.equal(reloaded[0]?.enabled, false);
});
