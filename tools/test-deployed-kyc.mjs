const apiUrl = normalizeUrl(process.env.API_URL);
const memberWebUrl = normalizeUrl(process.env.MEMBER_WEB_URL, false);
const adminWebUrl = normalizeUrl(process.env.ADMIN_WEB_URL, false);
const memberToken = String(process.env.PROD_MEMBER_TOKEN ?? '').trim();
const adminToken = String(process.env.PROD_ADMIN_TOKEN ?? '').trim();

if (!apiUrl) fail('API_URL is required');
if (!memberToken) fail('PROD_MEMBER_TOKEN is required');
if (!adminToken) fail('PROD_ADMIN_TOKEN is required');

const results = [];

await checkJson('member KYC read', `${apiUrl}/member/kyc`, memberToken, (payload) => {
  assert(payload && typeof payload === 'object', 'member KYC payload must be an object');
  assert(Array.isArray(payload.documents), 'member KYC documents must be an array');
  if (payload.item !== null && payload.item !== undefined) {
    assert(typeof payload.item === 'object', 'member KYC item must be an object or null');
    assert(typeof payload.item.status === 'string', 'member KYC item.status must be a string');
  }
});

let firstCaseId = '';
await checkJson('admin KYC queue read', `${apiUrl}/admin/kyc/cases?page=1&take=1`, adminToken, (payload) => {
  assert(payload && typeof payload === 'object', 'admin KYC queue payload must be an object');
  assert(Array.isArray(payload.items), 'admin KYC queue items must be an array');
  if (payload.items[0]) {
    assert(typeof payload.items[0].id === 'string', 'admin KYC queue item.id must be a string');
    firstCaseId = payload.items[0].id;
  }
});

if (firstCaseId) {
  await checkJson('admin KYC case detail read', `${apiUrl}/admin/kyc/cases/${encodeURIComponent(firstCaseId)}`, adminToken, (payload) => {
    assert(payload && typeof payload === 'object', 'admin KYC detail payload must be an object');
    assert(payload.item && typeof payload.item === 'object', 'admin KYC detail item must be an object');
    assert(Array.isArray(payload.documents), 'admin KYC detail documents must be an array');
  });
} else {
  results.push({ name: 'admin KYC case detail read', status: 'SKIP', detail: 'queue is empty' });
}

if (memberWebUrl) await checkHtml('member KYC page', `${memberWebUrl}/kyc`, 'ยืนยันตัวตน KYC');
else results.push({ name: 'member KYC page', status: 'SKIP', detail: 'MEMBER_WEB_URL is not configured' });

if (adminWebUrl) await checkHtml('admin KYC page', `${adminWebUrl}/kyc`, 'ตรวจสอบ KYC');
else results.push({ name: 'admin KYC page', status: 'SKIP', detail: 'ADMIN_WEB_URL is not configured' });

for (const result of results) {
  console.log(`${result.status.padEnd(4)} ${result.name}${result.detail ? ` — ${result.detail}` : ''}`);
}

const failed = results.filter((result) => result.status === 'FAIL');
const passed = results.filter((result) => result.status === 'PASS');
const skipped = results.filter((result) => result.status === 'SKIP');
console.log(`KYC smoke result: ${passed.length} passed, ${failed.length} failed, ${skipped.length} skipped`);
if (failed.length) process.exit(1);

async function checkJson(name, url, token, validate) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-store',
      },
      signal: AbortSignal.timeout(20_000),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${safeSnippet(text)}`);
    let payload;
    try { payload = JSON.parse(text); } catch { throw new Error('response is not valid JSON'); }
    validate(payload);
    results.push({ name, status: 'PASS' });
  } catch (error) {
    results.push({ name, status: 'FAIL', detail: error instanceof Error ? error.message : String(error) });
  }
}

async function checkHtml(name, url, expectedText) {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'text/html', 'Cache-Control': 'no-store' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    });
    const html = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!html.includes(expectedText)) throw new Error(`page HTML does not contain expected text: ${expectedText}`);
    results.push({ name, status: 'PASS' });
  } catch (error) {
    results.push({ name, status: 'FAIL', detail: error instanceof Error ? error.message : String(error) });
  }
}

function normalizeUrl(value, required = true) {
  const normalized = String(value ?? '').trim().replace(/\/+$/, '');
  if (!normalized && required) return '';
  if (!normalized) return '';
  try {
    const url = new URL(normalized);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported protocol');
    return url.toString().replace(/\/+$/, '');
  } catch {
    fail(`Invalid URL: ${normalized}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function safeSnippet(value) {
  return String(value ?? '').replace(/\s+/g, ' ').slice(0, 240);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
