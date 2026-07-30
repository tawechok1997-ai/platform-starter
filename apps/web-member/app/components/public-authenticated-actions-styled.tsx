'use client';

import {
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useMemberSession } from '../member-session-provider';
import PublicAuthenticatedActions from './public-authenticated-actions';
import MemberHeaderFinanceRuntime from './member-header-finance-runtime';
import MemberMenuIncomeRuntime from './member-menu-income-runtime';
import MemberMenuVipRuntime from './member-menu-vip-runtime';
import '../member-authenticated-public-header.css';
import '../member-authenticated-public-header-runtime.css';
import '../member-authenticated-icon-assets.css';
import '../member-authenticated-profile-source.css';
import '../member-authenticated-source-header-geometry.css';
import '../member-menu-income-runtime.css';
import '../member-vip-modal.css';
import '../member-header-finance-runtime.css';
import '../member-authenticated-menu-assets.css';
import '../member-authenticated-shared-lock.css';

type Props = ComponentProps<typeof PublicAuthenticatedActions>;

const WALLET_TRIGGER_SELECTOR = '.public-member-wallet-balance';
const WALLET_ICON_SELECTOR = '.public-member-header-wallet';
const WALLET_AMOUNT_SELECTOR = '.public-member-wallet-balance strong';
const WALLET_ANIMATION_SOURCE = '/assets/asset-pc/images/a_wallet_animate.webp';
const MINIMUM_REFRESH_FEEDBACK_MS = 720;

export default function PublicAuthenticatedActionsStyled(props: Props) {
  const { refreshWallet } = useMemberSession();
  const rootRef = useRef<HTMLDivElement>(null);
  const refreshInFlightRef = useRef(false);
  const [refreshing, setRefreshing] = useState(false);

  const replayWalletAnimation = useCallback(() => {
    const image = rootRef.current?.querySelector<HTMLImageElement>(WALLET_ICON_SELECTOR);
    if (!image) return;
    image.src = `${WALLET_ANIMATION_SOURCE}?replay=${Date.now()}`;
  }, []);

  const refreshSharedWallet = useCallback(async () => {
    if (refreshInFlightRef.current) return;

    refreshInFlightRef.current = true;
    setRefreshing(true);
    replayWalletAnimation();

    try {
      await Promise.all([
        refreshWallet(),
        new Promise<void>((resolve) => window.setTimeout(resolve, MINIMUM_REFRESH_FEEDBACK_MS)),
      ]);
    } finally {
      refreshInFlightRef.current = false;
      setRefreshing(false);
    }
  }, [refreshWallet, replayWalletAnimation]);

  useEffect(() => {
    const root = rootRef.current;
    const trigger = root?.querySelector<HTMLElement>(WALLET_TRIGGER_SELECTOR);
    const amount = root?.querySelector<HTMLElement>(WALLET_AMOUNT_SELECTOR);
    if (!trigger || !amount) return;

    trigger.setAttribute('role', 'button');
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('aria-label', props.locale === 'th' ? 'รีเฟรชยอดเงินคงเหลือ' : 'Refresh wallet balance');
    trigger.setAttribute('aria-busy', refreshing ? 'true' : 'false');
    trigger.setAttribute('title', props.locale === 'th' ? 'กดเพื่อรีเฟรชยอดเงิน' : 'Refresh wallet balance');
    amount.classList.add('public-member-wallet-amount');
    amount.setAttribute('aria-live', 'polite');
  }, [props.compactWalletBalance, props.locale, refreshing]);

  const handleClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(WALLET_TRIGGER_SELECTOR)) return;
    void refreshSharedWallet();
  };

  const handleKeyDownCapture = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(WALLET_TRIGGER_SELECTOR)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    void refreshSharedWallet();
  };

  return (
    <div
      ref={rootRef}
      className="public-authenticated-shared-island"
      data-wallet-refreshing={refreshing ? 'true' : 'false'}
      onClickCapture={handleClickCapture}
      onKeyDownCapture={handleKeyDownCapture}
    >
      <PublicAuthenticatedActions {...props} />
      <MemberHeaderFinanceRuntime locale={props.locale} />
      <MemberMenuIncomeRuntime locale={props.locale} />
      <MemberMenuVipRuntime locale={props.locale} />
    </div>
  );
}
