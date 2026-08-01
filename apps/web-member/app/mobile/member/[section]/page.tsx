import MobileMemberBonusPage from '../../../components/mobile-home/mobile-member-bonus-page';
import MobileMemberGuideRoute from '../../../components/mobile-home/mobile-member-guide-route';
import MobileMemberSectionPage from '../../../components/mobile-home/mobile-member-section-page';

export default async function MobileMemberSectionRoute({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (section === 'bonus') return <MobileMemberBonusPage />;
  if (section === 'guide') return <MobileMemberGuideRoute />;
  return <MobileMemberSectionPage section={section} />;
}
