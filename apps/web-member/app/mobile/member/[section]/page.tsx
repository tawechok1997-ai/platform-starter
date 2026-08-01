import MobileMemberSectionPage from '../../../components/mobile-home/mobile-member-section-page';

export default async function MobileMemberSectionRoute({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <MobileMemberSectionPage section={section} />;
}
