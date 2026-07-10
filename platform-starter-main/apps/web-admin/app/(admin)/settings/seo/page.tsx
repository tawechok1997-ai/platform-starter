import SettingsSectionPage from '../settings-section-page';

export default function SeoSettingsPage() {
  return (
    <SettingsSectionPage
      group="seo"
      title="SEO Settings"
      description="ตั้งค่า meta, sitemap, robots และ social preview"
      fields={[
        { key: 'default_title', label: 'Default Meta Title' },
        { key: 'default_description', label: 'Default Meta Description', type: 'textarea' },
        { key: 'default_keywords', label: 'Default Keywords' },
        { key: 'canonical_url', label: 'Canonical URL' },
        { key: 'og_title', label: 'OG Title' },
        { key: 'og_description', label: 'OG Description', type: 'textarea' },
        { key: 'og_image', label: 'OG Image URL' },
        { key: 'twitter_card', label: 'Twitter Card' },
        { key: 'robots_index', label: 'Robots Index', type: 'checkbox' },
        { key: 'robots_follow', label: 'Robots Follow', type: 'checkbox' },
        { key: 'google_site_verification', label: 'Google Site Verification' },
        { key: 'bing_verification', label: 'Bing Verification' },
      ]}
    />
  );
}
