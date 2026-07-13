const target = process.env.RATE_LIMIT_TEST_URL;
const count = Number(process.env.RATE_LIMIT_TEST_COUNT ?? 12);
const expectedStatus = Number(process.env.RATE_LIMIT_EXPECTED_STATUS ?? 429);

if (!target) {
  console.error('Set RATE_LIMIT_TEST_URL to an explicitly approved reverse-proxy URL.');
  process.exit(2);
}
if (!/^https?:\/\//i.test(target)) {
  console.error('RATE_LIMIT_TEST_URL must be an http(s) URL.');
  process.exit(2);
}
if (!Number.isInteger(count) || count < 1 || count > 100) {
  console.error('RATE_LIMIT_TEST_COUNT must be between 1 and 100.');
  process.exit(2);
}

let sawExpected = false;
for (let index = 1; index <= count; index += 1) {
  const response = await fetch(target, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-rate-limit-test': 'true' },
    body: JSON.stringify({ identifier: 'rate-limit-test-invalid-user' }),
  });
  console.log(JSON.stringify({ attempt: index, status: response.status, retryAfter: response.headers.get('retry-after') }));
  if (response.status === expectedStatus) {
    sawExpected = true;
    break;
  }
}

if (!sawExpected) {
  console.error(`Expected HTTP ${expectedStatus} from the configured reverse proxy.`);
  process.exit(1);
}
console.log('Reverse-proxy rate-limit smoke test passed.');
