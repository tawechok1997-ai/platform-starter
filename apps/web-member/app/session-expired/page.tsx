import { PublicPageShell } from '../components/public-page-shell';
import SessionExpiredContent from './session-expired-content';

export default function SessionExpiredPage() {
  return (
    <PublicPageShell>
      <SessionExpiredContent />
    </PublicPageShell>
  );
}
