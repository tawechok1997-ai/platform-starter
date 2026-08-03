export type AdminFieldError = {
  field: string;
  message: string;
};

export type AdminValueDiff = {
  path: string;
  before: unknown;
  after: unknown;
};

export function normalizeAdminFieldErrors(input: unknown): readonly AdminFieldError[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return Object.freeze(input.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const field = 'field' in item ? String(item.field ?? '').trim() : '';
      const message = 'message' in item ? String(item.message ?? '').trim() : '';
      return field && message ? [{ field, message }] : [];
    }));
  }
  if (typeof input === 'object') {
    return Object.freeze(Object.entries(input).flatMap(([field, value]) => {
      if (Array.isArray(value)) return value.map((message) => ({ field, message: String(message) })).filter((error) => error.message.trim());
      const message = String(value ?? '').trim();
      return message ? [{ field, message }] : [];
    }));
  }
  return [];
}

export function diffAdminValues(before: unknown, after: unknown): readonly AdminValueDiff[] {
  const diffs: AdminValueDiff[] = [];
  visitDiff(before, after, '', diffs);
  return Object.freeze(diffs);
}

export function hasAdminValueChanges(before: unknown, after: unknown) {
  return diffAdminValues(before, after).length > 0;
}

export function redactAdminDiff(
  diffs: readonly AdminValueDiff[],
  sensitivePaths: readonly string[],
): readonly AdminValueDiff[] {
  const sensitive = new Set(sensitivePaths);
  return Object.freeze(diffs.map((diff) => sensitive.has(diff.path)
    ? Object.freeze({ ...diff, before: diff.before === undefined ? undefined : '[REDACTED]', after: diff.after === undefined ? undefined : '[REDACTED]' })
    : diff));
}

function visitDiff(before: unknown, after: unknown, path: string, diffs: AdminValueDiff[]) {
  if (Object.is(before, after)) return;
  if (isPlainRecord(before) && isPlainRecord(after)) {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
    for (const key of keys) visitDiff(before[key], after[key], path ? `${path}.${key}` : key, diffs);
    return;
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length);
    for (let index = 0; index < length; index += 1) visitDiff(before[index], after[index], `${path}[${index}]`, diffs);
    return;
  }
  diffs.push(Object.freeze({ path: path || '$', before, after }));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
