import type { TypedPublicSiteSettings } from '../site-settings-types';
import MemberFooter from '../member-footer';
import { DesktopAllianceBand } from './member-home/desktop-alliance-band';

export default function PublicLowerShell({ settings }: { settings: TypedPublicSiteSettings }) {
  return (
    <div className="public-lower-shell" data-public-lower-shell="home-source">
      <DesktopAllianceBand />
      <MemberFooter settings={settings} />
    </div>
  );
}
