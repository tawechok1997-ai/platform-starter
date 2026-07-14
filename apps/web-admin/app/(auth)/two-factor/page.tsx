'use client';

import { FormEvent, useState } from 'react';
import { ApiClientError, createApiClient } from '@platform/api-client';
import { setAdminAccessToken } from '../../admin-api';

const twoFactorClient = createApiClient({ baseUrl: '', timeoutMs: 15000 });
type VerifyResponse = { accessToken?: string };

export default function AdminTwoFactorPage() {
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('กำลังยืนยัน...');
    try {
      const data = await twoFactorClient.requestJson<VerifyResponse, { challengeId: string; code: string }>('/api/admin/auth/2fa/verify', {
        method: 'POST', credentials: 'include', auth: false, body: { challengeId, code },
      });
      if (!data.accessToken) { setMessage('ยืนยันไม่สำเร็จ'); return; }
      setAdminAccessToken(data.accessToken);
      setMessage('ยืนยันสำเร็จ');
    } catch (error) {
      setMessage(error instanceof ApiClientError ? error.message : 'ยืนยันไม่สำเร็จ');
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '48px auto', padding: 24 }}>
      <h1>Admin 2FA</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input value={challengeId} onChange={(e) => setChallengeId(e.target.value)} placeholder="Challenge ID" />
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" />
        <button type="submit">Verify</button>
      </form>
      {message && <p>{message}</p>}
    </main>
  );
}
