import SettingsSectionPage from '../settings-section-page';

export default function MaintenanceSettingsPage() {
  return (
    <SettingsSectionPage
      group="maintenance"
      title="Maintenance Settings"
      description="เปิด/ปิดปรับปรุงระบบทั้งหมด หรือแยกเฉพาะ member, admin, ฝาก, ถอน และ provider"
      preview="maintenance"
      fields={[
        { key: 'enabled', label: 'Maintenance Mode', type: 'checkbox' },
        { key: 'member_enabled', label: 'Member Maintenance', type: 'checkbox' },
        { key: 'admin_enabled', label: 'Admin Maintenance', type: 'checkbox' },
        { key: 'deposit_enabled', label: 'Deposit Maintenance', type: 'checkbox' },
        { key: 'withdraw_enabled', label: 'Withdraw Maintenance', type: 'checkbox' },
        { key: 'provider_enabled', label: 'Provider Maintenance', type: 'checkbox' },
        { key: 'message', label: 'Message', type: 'textarea', placeholder: 'ระบบกำลังปรับปรุง' },
        { key: 'start_time', label: 'Start Time' },
        { key: 'end_time', label: 'End Time' },
        { key: 'allow_admin_access', label: 'Allow Admin Access', type: 'checkbox' },
        { key: 'super_admin_only', label: 'Super Admin only', type: 'checkbox' },
      ]}
    />
  );
}
