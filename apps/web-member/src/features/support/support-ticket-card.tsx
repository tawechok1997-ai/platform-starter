'use client';

import { MemberButton, MemberCard } from '../../../app/components/member-ui';

export type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  severity: string;
  category: string;
  messages?: Array<{ by: string; message: string; createdAt: string }>;
  createdAt: string;
};

export function SupportTicketCard({
  item,
  replyText,
  replying,
  replyingLocked,
  onReplyTextChange,
  onReply,
  categoryLabel,
  statusLabel,
}: {
  item: SupportTicket;
  replyText: string;
  replying: boolean;
  replyingLocked: boolean;
  onReplyTextChange: (value: string) => void;
  onReply: () => void;
  categoryLabel: (value: string) => string;
  statusLabel: (value: string) => string;
}) {
  return (
    <MemberCard className="member-support-ticket">
      <div className="member-support-ticket-head">
        <div>
          <strong>{item.subject}</strong>
          <p>{categoryLabel(item.category)} · {new Date(item.createdAt).toLocaleString('th-TH')}</p>
        </div>
        <span>{statusLabel(item.status)}</span>
      </div>
      <p>{item.message}</p>
      <div className="member-support-thread" aria-label={`Timeline ${item.subject}`}>
        {(item.messages ?? []).slice(-5).map((message, index) => (
          <div key={`${item.id}-${index}`}>
            <strong>{message.by === 'admin' ? 'แอดมิน' : message.by === 'member' ? 'คุณ' : 'ระบบ'}</strong>
            <span>{message.message}</span>
            <small>{new Date(message.createdAt).toLocaleString('th-TH')}</small>
          </div>
        ))}
      </div>
      <label>
        <span>ตอบกลับ</span>
        <textarea
          disabled={replying}
          maxLength={2000}
          value={replyText}
          onChange={(event) => onReplyTextChange(event.target.value)}
          placeholder="พิมพ์ข้อความเพิ่มเติม"
        />
      </label>
      <MemberButton disabled={replyingLocked || !replyText.trim()} tone="default" onClick={onReply}>
        {replying ? 'กำลังส่ง...' : 'ตอบกลับ'}
      </MemberButton>
    </MemberCard>
  );
}
