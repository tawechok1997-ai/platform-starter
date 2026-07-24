type MoneyRequestStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | string;

export type MoneyRequest = {
  id: string;
  amount: string;
  currency: string;
  status: MoneyRequestStatus;
  method?: string | null;
  createdAt: string;
};

export type LedgerItem = {
  id: string;
  type: string;
  direction: 'CREDIT' | 'DEBIT' | string;
  amount: string;
  balanceBefore?: string;
  balanceAfter: string;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
};

export type GameMedia = {
  type: string;
  sourceUrl?: string | null;
  cachedUrl?: string | null;
};

export type GameProviderSummary = {
  name?: string | null;
  code?: string | null;
  logoUrl?: string | null;
};

export type Game = {
  id: string;
  providerGameCode: string;
  name: string;
  category: string;
  platform?: string;
  imageUrl?: string | null;
  iconUrl?: string | null;
  isFeatured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  provider?: GameProviderSummary | null;
  media?: GameMedia[];
};

export type GameLobbyPayload = {
  items?: Game[];
  featured?: Game[];
  newest?: Game[];
  popular?: Game[];
  categories?: string[];
  providers?: GameProviderSummary[];
};

export type PaginatedItems<T> = {
  items?: T[];
  message?: string;
};