import {
  AdminBadge,
  AdminCard,
  AdminGrid,
  AdminLinkButton,
  AdminMetric,
  AdminMetricGrid,
  AdminPage,
  AdminStack,
} from '../_components/admin-ui';
import {
  ADMIN_SETTINGS_ROUTE_REGISTRY,
  type AdminSettingsImpact,
  type AdminSettingsMigrationStatus,
} from '../../../src/features/admin-modernization/settings-ownership';

const SYSTEM_SETTINGS = ADMIN_SETTINGS_ROUTE_REGISTRY.filter((definition) => definition.owner === '/system-settings');

const STATUS_LABELS: Record<AdminSettingsMigrationStatus, string> = {
  keep: 'Owner',
  merge: 'กำลังรวม',
  redirect: 'Redirect',
  deprecated: 'เลิกใช้',
  remove: 'ลบ',
};

const IMPACT_LABELS: Record<AdminSettingsImpact, string> = {
  normal: 'ทั่วไป',
  operational: 'ปฏิบัติการ',
  sensitive: 'ข้อมูลสำคัญ',
};

export default function SystemSettingsPage() {
  const sensitiveCount = SYSTEM_SETTINGS.filter((definition) => definition.impact === 'sensitive').length;
  const migrationCount = SYSTEM_SETTINGS.filter((definition) => definition.status !== 'keep').length;

  return <AdminPage
    eyebrow="การดูแลระบบ"
    title="การตั้งค่าระบบ"
    description="Owner กลางสำหรับค่ายเกม การเชื่อมต่อ Credentials และการตั้งค่าเกมที่มีผลต่อระบบ"
    actions={<AdminLinkButton href="/settings" tone="ghost">การตั้งค่าเว็บไซต์</AdminLinkButton>}
  >
    <AdminStack>
      <AdminMetricGrid>
        <AdminMetric title="Route ภายใต้ Owner" value={SYSTEM_SETTINGS.length.toLocaleString('th-TH')} />
        <AdminMetric title="ข้อมูลสำคัญ" value={sensitiveCount.toLocaleString('th-TH')} tone="warning" />
        <AdminMetric title="กำลังย้ายเข้า Owner กลาง" value={migrationCount.toLocaleString('th-TH')} />
      </AdminMetricGrid>

      <AdminCard
        title="ขอบเขตการเขียนข้อมูล"
        description="ค่าระบบทุกชุดต้องมี Write owner เดียว การแก้ Credentials หรือ Provider configuration ต้องผ่าน Permission, การยืนยัน, เหตุผล และ Audit"
      >
        <AdminGrid>
          {SYSTEM_SETTINGS.map((definition) => <AdminCard
            key={definition.route}
            compact
            title={routeTitle(definition.route)}
            description={definition.dataKeys.length > 0 ? definition.dataKeys.join(' · ') : 'ไม่มีการเขียนข้อมูลโดยตรง'}
            action={<span className="admin-system-settings-badges"><AdminBadge tone={impactTone(definition.impact)}>{IMPACT_LABELS[definition.impact]}</AdminBadge><AdminBadge>{STATUS_LABELS[definition.status]}</AdminBadge></span>}
          >
            <AdminStack>
              <small>{definition.route}</small>
              <small>Permission: {definition.permissionBase}</small>
              <AdminLinkButton href={definition.replacementRoute ?? definition.route} tone="secondary">เปิดการตั้งค่า</AdminLinkButton>
            </AdminStack>
          </AdminCard>)}
        </AdminGrid>
      </AdminCard>
    </AdminStack>
  </AdminPage>;
}

function routeTitle(route: string) {
  const labels: Record<string, string> = {
    '/system-settings': 'ศูนย์การตั้งค่าระบบ',
    '/simple-game-settings': 'ตั้งค่าค่ายเกม',
    '/provider-setup-wizard': 'เพิ่มค่ายเกม',
    '/provider-presets': 'ชุดตั้งค่าค่ายเกม',
    '/provider-credentials': 'ข้อมูลเชื่อมต่อค่ายเกม',
    '/game-api-settings': 'API ค่ายเกมแบบเดิม',
    '/game-control/home-games': 'เกมที่แสดงหน้าแรก',
  };
  return labels[route] ?? route;
}

function impactTone(impact: AdminSettingsImpact): 'neutral' | 'warning' | 'danger' {
  if (impact === 'sensitive') return 'danger';
  if (impact === 'operational') return 'warning';
  return 'neutral';
}
