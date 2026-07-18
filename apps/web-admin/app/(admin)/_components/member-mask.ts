export function maskPhone(value: string | null | undefined, visible: boolean) {
  if (!value) return '-';
  if (visible) return value;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 4 ? `xxx-xxx-${digits.slice(-4)}` : '••••••';
}

export function maskEmail(value: string | null | undefined, visible: boolean) {
  if (!value) return '-';
  if (visible) return value;
  const [local = '', domain] = value.split('@');
  if (!local || !domain) return '••••••';
  return `${local.slice(0, 2)}***@${domain}`;
}

export function maskAccount(value: string | null | undefined, visible: boolean) {
  if (!value) return '-';
  if (visible) return value;
  const compact = value.replace(/\s/g, '');
  return compact.length <= 4 ? '••••' : `${'•'.repeat(Math.min(Math.max(compact.length - 4, 4), 12))}${compact.slice(-4)}`;
}

export function hasAnyPermission(permissions: readonly string[], required: readonly string[]) {
  return permissions.includes('*') || required.some((permission) => permissions.includes(permission));
}
