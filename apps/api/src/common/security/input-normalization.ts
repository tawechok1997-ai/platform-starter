export function normalizeUnicodeText(value: unknown, maximumLength = 500): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  return normalized.slice(0, Math.max(1, maximumLength));
}

export function normalizeEmail(value: unknown): string | null {
  const normalized = normalizeUnicodeText(value, 254)?.toLowerCase() ?? null;
  if (!normalized) return null;
  const at = normalized.lastIndexOf('@');
  if (at <= 0 || at === normalized.length - 1) return null;
  return normalized;
}

export function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.normalize('NFKC').trim();
  const leadingPlus = normalized.startsWith('+');
  const digits = normalized.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return null;
  return `${leadingPlus ? '+' : ''}${digits}`;
}

export function normalizeBankAccount(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const digits = value.normalize('NFKC').replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 34) return null;
  return digits;
}
