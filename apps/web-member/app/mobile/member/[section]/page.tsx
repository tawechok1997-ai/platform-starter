import MobileMemberBonusPage from '../../../components/mobile-home/mobile-member-bonus-page';
import MobileMemberSectionPage from '../../../components/mobile-home/mobile-member-section-page';

export default async function MobileMemberSectionRoute({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (section === 'bonus') return <MobileMemberBonusPage />;
  return <MobileMemberSectionPage section={section} />;
}
