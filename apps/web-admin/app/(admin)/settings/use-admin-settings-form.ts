'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';

type SettingsFormOptions<T extends Record<string, unknown>> = {
  endpoint: string;
  defaults: T;
  loadingMessage?: string;
};

type SaveResult = {
  requiresDualApproval?: boolean;
  message?: string;
};

export function useAdminSettingsForm<T extends Record<string, unknown>>({
  endpoint,
  defaults,
  loadingMessage = 'กำลังโหลด...',
}: SettingsFormOptions<T>) {
  const [form, setForm] = useState<T>(defaults);
  const [initialForm, setInitialForm] = useState<T>(defaults);
  const [message, setMessage] = useState(loadingMessage);
  const [saving, setSaving] = useState(false);
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);

  const load = useCallback(async () => {
    setMessage(loadingMessage);
    try {
      const res = await adminApiFetch(endpoint);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? `โหลด settings ไม่สำเร็จ (${res.status})`);
      const settings = { ...defaults, ...(data?.settings ?? {}) } as T;
      setForm(settings);
      setInitialForm(settings);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'โหลด settings ไม่สำเร็จ');
    }
  }, [defaults, endpoint, loadingMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const save = useCallback(async () => {
    setSaving(true);
    setMessage('กำลังบันทึก...');
    try {
      const res = await adminApiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null) as SaveResult | null;
      if (!res.ok) {
        setMessage(data?.message ?? `บันทึกไม่สำเร็จ (${res.status})`);
        return false;
      }
      setInitialForm(form);
      setMessage(data?.requiresDualApproval ? 'บันทึกแล้ว แต่รายการเสี่ยงควรเข้าคิว Dual Approval' : 'บันทึกสำเร็จ');
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
      return false;
    } finally {
      setSaving(false);
    }
  }, [endpoint, form]);

  const reset = useCallback(() => {
    setForm(initialForm);
    setMessage('คืนค่าล่าสุดจากระบบแล้ว');
  }, [initialForm]);

  const update = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  return {
    form,
    initialForm,
    message,
    saving,
    isDirty,
    setForm,
    setMessage,
    load,
    save,
    reset,
    update,
  };
}
