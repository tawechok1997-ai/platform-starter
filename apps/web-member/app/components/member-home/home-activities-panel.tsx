'use client';

import type { ReturnType } from 'react';
import type { CmsContent } from '../../site-settings';
import { useMemberHomeData } from '../../hooks/use-member-home-data';
import { FaqList, RecentActivity, SupportCard } from '../member-home-sections';

type MemberHomeData = ReturnType<typeof useMemberHomeData>;

export function HomeActivitiesPanel({
  active,
  data,
  content,
  primaryColor,
  depositEnabled,
  supportEnabled,
}: {
  active: boolean;
  data: MemberHomeData;
  content: CmsContent;
  primaryColor: string;
  depositEnabled: boolean;
  supportEnabled: boolean;
}) {
  return (
    <section
      className="member-source-panel member-source-panel--activities"
      hidden={!active}
      aria-label="กิจกรรม"
    >
      <RecentActivity
        ledgers={data.ledgers}
        loading={data.isActivityLoading}
        message={data.activityMessage}
        onRetry={data.reloadActivity}
        primaryColor={primaryColor}
        depositEnabled={depositEnabled}
      />
      <FaqList content={content} />
      {supportEnabled && <SupportCard />}
    </section>
  );
}
