'use client';

import { useEffect } from 'react';
import { memberApiFetch } from '../member-api';
import '../member-activity-prediction-runtime.css';

const ROUND_CODE = 'lottery-2026-q4';
const DETAIL_SELECTOR = '.member-source-activity-detail';
const INPUT_OWNER_SELECTOR = '.member-source-number-inputs';
const RUNTIME_OWNER = 'data-member-activity-submit-owner';

type LotteryOverview = {
  canSubmit?: boolean;
  entry?: {
    top_number?: string;
    bottom_number?: string;
    topNumber?: string;
    bottomNumber?: string;
  } | null;
  state?: { code?: string; label?: string };
};

export default function MemberActivityPredictionRuntime() {
  useEffect(() => {
    let disposed = false;
    const boundOwners = new WeakSet<HTMLElement>();

    const bindOwner = (inputOwner: HTMLElement) => {
      if (boundOwners.has(inputOwner) || inputOwner.hasAttribute(RUNTIME_OWNER)) return;
      const detail = inputOwner.closest<HTMLElement>(DETAIL_SELECTOR);
      const inputs = Array.from(inputOwner.querySelectorAll<HTMLInputElement>('input'));
      const [topInput, bottomInput] = inputs;
      if (!detail || !topInput || !bottomInput) return;

      boundOwners.add(inputOwner);
      inputOwner.setAttribute(RUNTIME_OWNER, 'true');
      topInput.setAttribute('aria-label', topInput.getAttribute('aria-label') || 'เลขท้าย 3 ตัวบน');
      bottomInput.setAttribute('aria-label', bottomInput.getAttribute('aria-label') || 'เลขท้าย 2 ตัวล่าง');
      topInput.autocomplete = 'off';
      bottomInput.autocomplete = 'off';
      topInput.pattern = '\\d{3}';
      bottomInput.pattern = '\\d{2}';

      const actionOwner = document.createElement('div');
      actionOwner.className = 'member-activity-prediction-actions';
      actionOwner.dataset.memberActivityPredictionActions = 'true';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'member-activity-prediction-submit';
      button.textContent = 'ยืนยันคำทาย';

      const status = document.createElement('p');
      status.className = 'member-activity-prediction-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');

      actionOwner.append(button, status);
      inputOwner.insertAdjacentElement('afterend', actionOwner);

      const setState = (message: string, kind: 'idle' | 'loading' | 'success' | 'error' = 'idle') => {
        status.textContent = message;
        status.dataset.state = kind;
        button.disabled = kind === 'loading' || kind === 'success';
        button.setAttribute('aria-busy', kind === 'loading' ? 'true' : 'false');
      };

      const requireLogin = () => {
        const current = new URL(window.location.href);
        const destination = `${current.pathname}${current.search}${current.hash}`;
        current.searchParams.set('auth', 'login');
        current.searchParams.set('next', destination);
        window.location.assign(`${current.pathname}${current.search}${current.hash}`);
      };

      const readDigits = (input: HTMLInputElement, length: number) => {
        const value = input.value.replace(/\D/g, '').slice(0, length);
        input.value = value;
        return value.length === length ? value : '';
      };

      const submit = async () => {
        const topNumber = readDigits(topInput, 3);
        const bottomNumber = readDigits(bottomInput, 2);
        if (!topNumber || !bottomNumber) {
          setState('กรุณากรอกเลข 3 ตัวบน และ 2 ตัวล่างให้ครบ', 'error');
          (!topNumber ? topInput : bottomInput).focus();
          return;
        }

        if (!hasMemberSession()) {
          requireLogin();
          return;
        }

        setState('กำลังส่งคำทาย...', 'loading');
        try {
          const response = await memberApiFetch(`/member/activities/lottery/${encodeURIComponent(ROUND_CODE)}/entries`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ topNumber, bottomNumber }),
          });
          const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
          if (response.status === 401) {
            requireLogin();
            return;
          }
          if (!response.ok) {
            throw new Error(readMessage(payload) || 'ส่งคำทายไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
          }

          topInput.disabled = true;
          bottomInput.disabled = true;
          setState('ส่งคำทายเรียบร้อยแล้ว', 'success');
        } catch (error) {
          setState(error instanceof Error ? error.message : 'ส่งคำทายไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
        }
      };

      const normalizeInput = (event: Event) => {
        const input = event.currentTarget;
        if (!(input instanceof HTMLInputElement)) return;
        const max = input === topInput ? 3 : 2;
        input.value = input.value.replace(/\D/g, '').slice(0, max);
        if (status.dataset.state === 'error') setState('', 'idle');
      };

      topInput.addEventListener('input', normalizeInput);
      bottomInput.addEventListener('input', normalizeInput);
      button.addEventListener('click', submit);

      if (hasMemberSession()) {
        void memberApiFetch(`/member/activities/lottery?roundCode=${encodeURIComponent(ROUND_CODE)}`)
          .then(async (response) => {
            if (!response.ok || disposed || !inputOwner.isConnected) return;
            const overview = await response.json().catch(() => null) as LotteryOverview | null;
            const entry = overview?.entry;
            if (entry) {
              topInput.value = String(entry.topNumber ?? entry.top_number ?? '');
              bottomInput.value = String(entry.bottomNumber ?? entry.bottom_number ?? '');
              topInput.disabled = true;
              bottomInput.disabled = true;
              setState('ส่งคำทายสำหรับรอบนี้แล้ว', 'success');
              return;
            }
            if (overview?.canSubmit === false) {
              setState(overview.state?.label || 'รอบกิจกรรมยังไม่เปิดหรือปิดรับคำทายแล้ว', 'error');
              button.disabled = true;
            }
          })
          .catch(() => undefined);
      }
    };

    const scan = (root: ParentNode = document) => {
      if (root instanceof HTMLElement && root.matches(INPUT_OWNER_SELECTOR)) bindOwner(root);
      root.querySelectorAll?.<HTMLElement>(INPUT_OWNER_SELECTOR).forEach(bindOwner);
    };

    scan();
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) scan(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, []);

  return null;
}

function hasMemberSession() {
  try {
    return Boolean(
      window.localStorage.getItem('member_access_token')
      || window.localStorage.getItem('member_refresh_token')
      || window.sessionStorage.getItem('member_access_token')
      || window.sessionStorage.getItem('member_refresh_token')
    );
  } catch {
    return false;
  }
}

function readMessage(payload: Record<string, unknown> | null) {
  if (!payload) return '';
  const value = payload.message ?? payload.error ?? payload.errorMessage;
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string').join(', ');
  return typeof value === 'string' ? value : '';
}
