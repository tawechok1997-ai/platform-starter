export type AdminProfileForm = {
  displayName: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  avatarUrl: string;
};

export const emptyAdminProfileForm: AdminProfileForm = {
  displayName: '',
  firstName: '',
  lastName: '',
  position: '',
  department: '',
  avatarUrl: '',
};

export function normalizeAdminProfileForm(value: Partial<Record<keyof AdminProfileForm, unknown>> | null | undefined): AdminProfileForm {
  return {
    displayName: text(value?.displayName),
    firstName: text(value?.firstName),
    lastName: text(value?.lastName),
    position: text(value?.position),
    department: text(value?.department),
    avatarUrl: text(value?.avatarUrl),
  };
}

export function adminProfileUpdatePayload(form: AdminProfileForm): AdminProfileForm {
  return {
    displayName: form.displayName.trim(),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    position: form.position.trim(),
    department: form.department.trim(),
    avatarUrl: form.avatarUrl.trim(),
  };
}

export function adminProfileErrorMessage(value: unknown, fallback: string) {
  if (typeof value !== 'object' || value === null || !('message' in value)) return fallback;
  const message = (value as { message?: unknown }).message;
  return typeof message === 'string' && message.trim() ? message : fallback;
}

function text(value: unknown) {
  return typeof value === 'string' ? value : '';
}
