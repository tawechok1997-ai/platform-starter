import type { ReactNode } from 'react';
import MobileP7P9ClosureRuntime from '../components/mobile-home/mobile-p7-p9-closure-runtime';

export default function DepositLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileP7P9ClosureRuntime phase="p9" route="/deposit" />
      {children}
    </>
  );
}
