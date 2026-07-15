/** Public boundary for the finance feature. Keep private implementation files unexported. */
export const FINANCE_FEATURE_BOUNDARY = 'finance' as const;
export { DepositView } from './deposit-view';
export { WithdrawalView, type WithdrawalViewProps } from './withdrawal-view';
export {
  DEPOSIT_FORM_DEFAULTS,
  parseDepositAmount,
  resolveDepositError,
  serializeDepositCreateRequest,
  serializeDepositEvidenceRequest,
  validateDepositSelection,
  type DepositFormValues,
} from './deposit-form';
export { financeInvalidationRules, financeQueryKeys } from './query-keys';
export { useDepositServerState } from './use-deposit-server-state';
export {
  createOptimisticSnapshot,
  hasUnsavedChanges,
  rollbackOptimisticChange,
  type Snapshot,
} from './form-regression';
