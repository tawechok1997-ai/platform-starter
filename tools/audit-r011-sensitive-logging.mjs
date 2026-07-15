import fs from 'node:fs';

const files = {
  policy: fs.readFileSync('apps/api/src/common/security/sensitive-log-redactor.ts', 'utf8'),
  main: fs.readFileSync('apps/api/src/main.ts', 'utf8'),
  filter: fs.readFileSync('apps/api/src/common/filters/http-exception.filter.ts', 'utf8'),
};

const failures = [];
const requireText = (name, source, text) => {
  if (!source.includes(text)) failures.push(`${name} must include ${text}`);
};

requireText('policy', files.policy, 'SENSITIVE_KEY_PATTERN');
requireText('policy', files.policy, 'SENSITIVE_QUERY_PATTERN');
requireText('main', files.main, 'toSafeLogRecord');
requireText('main', files.main, 'redactSensitiveUrl');
requireText('filter', files.filter, 'toSafeLogRecord');
requireText('filter', files.filter, 'redactSensitiveUrl');

if (/console\.(?:log|error|warn)\([^\n]*\berror\s*\)/.test(files.main)) {
  failures.push('main.ts must not log raw error objects');
}
if (/function\s+redactUrl\s*\(/.test(files.main)) {
  failures.push('main.ts must use the shared redaction policy');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('R-011 sensitive logging boundaries verified');
