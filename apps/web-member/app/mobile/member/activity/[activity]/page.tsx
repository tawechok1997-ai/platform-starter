import MobileMemberActivityDetailPage from '../../../../components/mobile-home/mobile-member-activity-detail-page';

export default async function MobileActivityDetailRoute({
  params,
}: {
  params: Promise<{ activity: string }>;
}) {
  const { activity } = await params;
  return <MobileMemberActivityDetailPage activity={activity} />;
}
