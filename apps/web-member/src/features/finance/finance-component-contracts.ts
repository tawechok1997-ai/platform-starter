import type { ReactNode } from 'react';

export type FinanceStep = {
  key: string;
  label: string;
};

export type FinanceCardTone = 'default' | 'success' | 'warning' | 'danger';

export type FinanceFlowShellProps = {
  title: string;
  description?: string | undefined;
  children: ReactNode;
  aside?: ReactNode | undefined;
};

export type FinanceStepIndicatorProps = {
  current: string;
  steps: FinanceStep[];
};

export type FinanceCardProps = {
  title?: string | undefined;
  description?: string | undefined;
  children: ReactNode;
  tone?: FinanceCardTone | undefined;
};

export type FinanceInfoRowProps = {
  label: string;
  value: string;
  action?: ReactNode | undefined;
};

export type FinanceActionBarProps = {
  children: ReactNode;
};

export type FinanceEmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode | undefined;
};

export type FinanceConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string | undefined;
  children: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean | undefined;
  confirmLabel?: string | undefined;
};

export type FinanceStatusBadgeProps = {
  status: string;
};
