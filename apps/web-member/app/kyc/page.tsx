'use client';

import styles from './kyc-responsive.module.css';
import MemberKycPage from '../../src/features/kyc/member-kyc-page';

export default function KycPage() {
  return <div className={styles.scope}><MemberKycPage /></div>;
}
