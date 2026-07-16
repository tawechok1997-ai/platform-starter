'use client';

import type { ChangeEvent, FormEvent } from 'react';
import {
  FinanceActionBar,
  FinanceCard,
  FinanceConfirmDialog,
  FinanceEmptyState,
  FinanceFlowShell,
  FinanceInfoRow,
  FinanceStatusBadge,
  FinanceStepIndicator,
} from '../../../app/components/member-finance-flow';
import {
  topUpStatusLabel,
  type DepositMethodCode,
  type DepositStep,
  type ReceivingAccount,
  type TopUpItem,
} from '../../../app/types/member-finance';

const AMOUNTS = [100, 300, 500, 1000, 3000, 5000];
const METHOD_CODES: DepositMethodCode[] = ['bank_transfer', 'promptpay', 'wallet', 'other'];
const METHODS: Record<DepositMethodCode, { label: string; numberLabel: string }> = {
  bank_transfer: { label: 'บัญชีธนาคาร', numberLabel: 'เลขบัญชี' },
  promptpay: { label: 'พร้อมเพย์', numberLabel: 'เบอร์พร้อมเพย์' },
  wallet: { label: 'วอเลต', numberLabel: 'วอเลต' },
  other: { label: 'อื่น ๆ', numberLabel: 'รายละเอียด' },
};
const STEPS = [
  { key: 'select', label: 'เลือกยอด' },
  { key: 'transfer', label: 'โอนและแนบสลิป' },
  { key: 'waiting', label: 'รอตรวจสอบ' },
];

type DepositViewProps = {
  step: DepositStep;
  amount: string;
  method: DepositMethodCode;
  accounts: ReceivingAccount[];
  history: TopUpItem[];
  selected: ReceivingAccount | null;
  slipImageData: string;
  slipImageName: string;
  transactionRef: string;
  note: string;
  message: string;
  loading: boolean;
  initialLoading: boolean;
  confirmOpen: boolean;
  lastRequest: TopUpItem | null;
  hasPendingRequest: boolean;
  parsedAmount: number;
  availableMethods: DepositMethodCode[];
  transferExpiresAt: number | null;
  transferExpired: boolean;
  remainingLabel: string;
  onAmountChange: (value: string) => void;
  onMethodChange: (value: DepositMethodCode) => void;
  onTransactionRefChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onNextStep: (event: FormEvent<HTMLFormElement>) => void;
  onUploadSlip: (event: ChangeEvent<HTMLInputElement>) => void;
  onCopyText: (value: string, label: string) => void;
  onOpenConfirm: () => void;
  onCloseConfirm: () => void;
  onSubmit: () => void;
  onBackToSelect: () => void;
  onCreateAnother: () => void;
};

export function DepositView(props: DepositViewProps) {
  const aside = (
    <FinanceCard title="รายการล่าสุด" description="สถานะคำขอฝากล่าสุดของคุณ">
      {props.history.slice(0, 5).map((item) => (
        <FinanceInfoRow
          key={item.id}
          label={`${methodLabel(item.method)} · ${new Date(item.createdAt).toLocaleString('th-TH')}`}
          value={`${item.currency} ${Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
          action={<FinanceStatusBadge status={item.status} />}
        />
      ))}
      {props.history.length === 0 && (
        <FinanceEmptyState title="ยังไม่มีรายการ" description="เมื่อส่งคำขอฝาก รายการล่าสุดจะแสดงที่นี่" />
      )}
    </FinanceCard>
  );

  return (
    <FinanceFlowShell title="ฝาก" description="เลือกยอด โอนเงิน และแนบสลิปให้ครบในขั้นตอนเดียว" aside={aside}>
      <FinanceStepIndicator current={props.step} steps={STEPS} />
      {props.message && <div className="member-ui-notice">{props.message}</div>}

      {props.step === 'select' && (
        <form onSubmit={props.onNextStep}>
          <FinanceCard title="เลือกยอดและช่องทาง" description="ระบบจะแสดงเฉพาะช่องทางที่รองรับยอดนี้">
            <div className="finance-amount-grid">
              {AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => props.onAmountChange(String(value))}
                  className={`finance-amount-button${Number(props.amount) === value ? ' is-active' : ''}`}
                >
                  ฿{value.toLocaleString('th-TH')}
                </button>
              ))}
            </div>
            <label className="finance-field">
              จำนวนเงิน
              <input
                value={props.amount}
                onChange={(event) => props.onAmountChange(event.target.value)}
                inputMode="decimal"
              />
            </label>
            <label className="finance-field">
              ช่องทาง
              <select
                value={props.method}
                onChange={(event) => props.onMethodChange(event.target.value as DepositMethodCode)}
                disabled={props.availableMethods.length === 0}
              >
                {METHOD_CODES.map((code) => (
                  <option key={code} value={code} disabled={!props.availableMethods.includes(code)}>
                    {METHODS[code].label}
                    {props.availableMethods.includes(code) ? '' : ' - ยังไม่เปิดใช้งาน'}
                  </option>
                ))}
              </select>
            </label>
            {!props.initialLoading && props.accounts.length === 0 && (
              <FinanceEmptyState
                title="ยังไม่มีบัญชีธนาคาร"
                description="ยังไม่มีช่องทางสำหรับรับฝากตอนนี้ กรุณาลองใหม่ภายหลัง"
              />
            )}
            {!props.initialLoading && props.accounts.length > 0 && props.availableMethods.length === 0 && (
              <FinanceEmptyState
                title="ไม่พบช่องทางที่รองรับยอดนี้"
                description="ลองเปลี่ยนยอดฝาก หรือเลือกยอดที่อยู่ในช่วงที่ระบบเปิดรับ"
              />
            )}
            <FinanceActionBar>
              <button
                type="submit"
                disabled={props.loading || props.availableMethods.length === 0}
                className="finance-button finance-button--primary"
              >
                {props.loading ? 'กำลังเตรียม...' : 'ถัดไป'}
              </button>
            </FinanceActionBar>
          </FinanceCard>
        </form>
      )}

      {props.step === 'transfer' && props.selected && (
        <FinanceCard title="โอนเงินและแนบสลิป" description="โอนยอดให้ตรงกับรายการ แล้วแนบสลิปก่อนส่งตรวจสอบ">
          <div className="finance-highlight">
            <span>ยอดฝาก</span>
            <strong>฿{props.parsedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong>
            <em>{METHODS[props.method].label}</em>
          </div>
          {props.transferExpiresAt && (
            <FinanceInfoRow label="หมดอายุใน" value={props.transferExpired ? 'หมดเวลาแล้ว' : props.remainingLabel} />
          )}
          {props.transferExpired && (
            <FinanceEmptyState
              title="รายการฝากหมดเวลาแล้ว"
              description="เพื่อป้องกันยอด/บัญชีรับเงินคลาดเคลื่อน กรุณากลับไปเริ่มรายการใหม่"
            />
          )}
          <FinanceInfoRow label="ชื่อบัญชี" value={props.selected.accountName} />
          <FinanceInfoRow
            label={METHODS[props.method].numberLabel}
            value={props.selected.accountNumber}
            action={
              <button
                type="button"
                onClick={() => props.onCopyText(props.selected!.accountNumber, METHODS[props.method].numberLabel)}
                className="finance-copy-button"
              >
                คัดลอก
              </button>
            }
          />
          {props.selected.promptPay && (
            <FinanceInfoRow
              label="พร้อมเพย์"
              value={props.selected.promptPay}
              action={
                <button
                  type="button"
                  onClick={() => props.onCopyText(props.selected?.promptPay ?? '', 'พร้อมเพย์')}
                  className="finance-copy-button"
                >
                  คัดลอก
                </button>
              }
            />
          )}
          {props.selected.qrImageUrl && (
            <img src={props.selected.qrImageUrl} alt="QR สำหรับชำระเงิน" className="finance-qr" />
          )}
          <label className="finance-field">
            เลขอ้างอิงธุรกรรม
            <input
              value={props.transactionRef}
              onChange={(event) => props.onTransactionRefChange(event.target.value)}
              placeholder="กรอกเลขอ้างอิงจากสลิป"
            />
          </label>
          <label className="finance-field">
            แนบสลิป
            <input type="file" accept="image/*" onChange={props.onUploadSlip} />
          </label>
          {props.slipImageData && (
            <div className="finance-slip-preview">
              <strong>ตัวอย่างสลิป</strong>
              <img src={props.slipImageData} alt="สลิปที่แนบ" />
            </div>
          )}
          <label className="finance-field">
            หมายเหตุ
            <textarea
              value={props.note}
              onChange={(event) => props.onNoteChange(event.target.value)}
              placeholder="รายละเอียดเพิ่มเติม ถ้ามี"
            />
          </label>
          <FinanceActionBar>
            <button
              type="button"
              onClick={props.onBackToSelect}
              disabled={props.loading || props.hasPendingRequest}
              className="finance-button finance-button--secondary"
            >
              ย้อนกลับ
            </button>
            <button
              type="button"
              onClick={props.onOpenConfirm}
              disabled={props.loading || !props.slipImageData || (props.transferExpired && !props.hasPendingRequest)}
              className="finance-button finance-button--primary"
            >
              {props.hasPendingRequest ? 'ลองส่งสลิปอีกครั้ง' : 'ตรวจสอบก่อนส่ง'}
            </button>
          </FinanceActionBar>
        </FinanceCard>
      )}

      {props.step === 'waiting' && (
        <FinanceCard
          title={props.lastRequest?.status === 'DUPLICATE' ? 'ไม่รับรายการ' : 'รอตรวจสอบ'}
          description={
            props.lastRequest?.status === 'DUPLICATE'
              ? 'ระบบพบว่าสลิปนี้เคยถูกใช้แล้ว จึงยกเลิกรายการทันที'
              : 'ระบบรับสลิปแล้ว รอแอดมินตรวจสอบและเพิ่มเครดิต'
          }
          tone={props.lastRequest?.status === 'DUPLICATE' ? undefined : 'success'}
        >
          <FinanceInfoRow
            label="สถานะ"
            value={props.lastRequest ? topUpStatusLabel(props.lastRequest.status) : 'รอตรวจสลิป'}
            action={<FinanceStatusBadge status={props.lastRequest?.status ?? 'PENDING_SLIP_REVIEW'} />}
          />
          {props.lastRequest?.duplicateOfId && (
            <FinanceInfoRow label="รายการที่ใช้สลิปนี้แล้ว" value={props.lastRequest.duplicateOfId} />
          )}
          {props.lastRequest?.adminNote && <FinanceInfoRow label="รายละเอียด" value={props.lastRequest.adminNote} />}
          <FinanceActionBar>
            <a href="/transactions" className="finance-button finance-button--secondary">
              ดูประวัติ
            </a>
            <button type="button" onClick={props.onCreateAnother} className="finance-button finance-button--primary">
              สร้างรายการใหม่
            </button>
          </FinanceActionBar>
        </FinanceCard>
      )}

      <FinanceConfirmDialog
        open={props.confirmOpen && Boolean(props.selected)}
        title={props.hasPendingRequest ? 'ส่งสลิปอีกครั้ง' : 'ตรวจสอบรายการฝาก'}
        description={
          props.hasPendingRequest
            ? 'ระบบจะส่งสลิปเข้ารายการเดิม โดยไม่สร้างคำขอฝากซ้ำ'
            : 'ตรวจข้อมูลให้ถูกต้องก่อนส่งรายการ'
        }
        onClose={props.onCloseConfirm}
        onConfirm={props.onSubmit}
        loading={props.loading}
        confirmLabel={props.hasPendingRequest ? 'ลองส่งสลิปอีกครั้ง' : 'ยืนยันส่งรายการ'}
      >
        <FinanceInfoRow
          label="ยอดฝาก"
          value={`THB ${props.parsedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
        />
        <FinanceInfoRow label="ช่องทาง" value={METHODS[props.method].label} />
        {props.selected && (
          <FinanceInfoRow
            label="บัญชีธนาคาร"
            value={`${props.selected.accountName} / ${props.selected.accountNumber}`}
          />
        )}
        {props.transactionRef && <FinanceInfoRow label="เลขอ้างอิง" value={props.transactionRef} />}
        {props.slipImageName && <FinanceInfoRow label="สลิป" value={props.slipImageName} />}
        {props.note && <FinanceInfoRow label="หมายเหตุ" value={props.note} />}
      </FinanceConfirmDialog>
    </FinanceFlowShell>
  );
}

function methodLabel(value?: string | null) {
  if (value === 'bank_transfer') return 'บัญชีธนาคาร';
  if (value === 'promptpay') return 'พร้อมเพย์';
  if (value === 'wallet') return 'วอเลต';
  return value || '-';
}
