'use client';

/**
 * Compatibility export for route-level imports. Finance UI ownership lives in
 * src/features/finance so route components do not become the design-system source.
 */
export {
  FinanceActionBar,
  FinanceCard,
  FinanceConfirmDialog,
  FinanceEmptyState,
  FinanceFlowShell,
  FinanceInfoRow,
  FinanceStatusBadge,
  FinanceStepIndicator,
} from '../../src/features/finance/finance-components';
