export const financeQueryKeys = {
  all: ['finance'] as const,
  topUps: () => [...financeQueryKeys.all, 'topups'] as const,
  topUpList: (memberId?: string) => [...financeQueryKeys.topUps(), 'list', memberId ?? 'self'] as const,
  receivingAccounts: () => [...financeQueryKeys.all, 'receiving-accounts'] as const,
  receivingAccount: (paymentType: string, amount: number) => [
    ...financeQueryKeys.receivingAccounts(),
    'detail',
    paymentType,
    amount,
  ] as const,
};

export const financeInvalidationRules = {
  afterDepositCreated: [financeQueryKeys.topUps(), financeQueryKeys.topUpList()],
  afterReceivingAccountChanged: [financeQueryKeys.receivingAccounts()],
} as const;
