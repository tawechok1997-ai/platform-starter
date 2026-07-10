import { AdminBadge, AdminCard, AdminGrid, AdminMetric, AdminMetricGrid, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

const adapterMethods = [
  ['healthCheck()', 'ตรวจ provider พร้อมใช้งานไหม'],
  ['launchGame()', 'สร้าง launch URL/session ให้ member เข้าเกม'],
  ['getBalance()', 'ดึงยอด provider wallet หรือ seamless balance'],
  ['transferIn()', 'โยกเงินเข้า provider สำหรับ transfer wallet'],
  ['transferOut()', 'โยกเงินกลับระบบหลัก'],
  ['syncGames()', 'ดึงรายชื่อเกมและรูปจากค่ายเกม'],
  ['getBetHistory()', 'ดึงประวัติเดิมพันเพื่อ reconcile'],
  ['validateWebhook()', 'ตรวจ signature / secret / IP source'],
  ['parseWebhook()', 'แปลง callback เป็น event กลางของระบบ'],
];

const normalizationRules = [
  'Normalize provider errors into internal error codes',
  'Normalize game payloads into internal game schema',
  'Normalize image fields into cover/icon/banner fields',
  'Normalize bet/round payloads into internal transaction schema',
  'Mask secrets in request/response logs',
  'Support sandbox/test mode per provider',
];

const safetyRules = [
  'Adapter-level timeout and retry policy',
  'Idempotency key for transfer/callback operations',
  'No duplicate debit/credit on retry',
  'Raw payload logging with secret masking',
  'Circuit breaker for repeated provider errors',
  'Health status for admin dashboard',
];

export default function ProviderAdaptersPage() {
  return (
    <AdminPage eyebrow="Game Platform" title="Provider Adapters" description="สัญญากลางสำหรับคุยกับ API ค่ายเกมทุกเจ้า โดยไม่ให้โค้ดหลักกลายเป็นบะหมี่ provider">
      <AdminMetricGrid>
        <AdminMetric title="Adapter methods" value={String(adapterMethods.length)} helper="launch, balance, transfer, sync, webhook" />
        <AdminMetric title="Normalization" value={String(normalizationRules.length)} helper="errors, games, images, bet rounds" />
        <AdminMetric title="Safety rules" value={String(safetyRules.length)} helper="timeout, retry, idempotency, masking" />
      </AdminMetricGrid>

      <AdminCard title="Shared adapter contract" description="ทุก provider adapter ต้อง implement method กลางชุดนี้">
        <AdminStack>{adapterMethods.map(([method, description]) => <AdminRow key={method}><div><strong>{method}</strong><p>{description}</p></div><AdminBadge tone="warning">Required</AdminBadge></AdminRow>)}</AdminStack>
      </AdminCard>

      <AdminGrid>
        <AdminCard title="Normalization rules" description="ทำให้ payload จากแต่ละค่ายกลายเป็นภาษากลางของระบบ">
          <AdminStack>{normalizationRules.map((item) => <AdminRow key={item}><strong>{item}</strong><AdminBadge>Normalize</AdminBadge></AdminRow>)}</AdminStack>
        </AdminCard>

        <AdminCard title="Safety / reliability" description="กัน callback ซ้ำ retry ซ้ำ secret หลุด และ provider ล่มแบบเงียบ ๆ">
          <AdminStack>{safetyRules.map((item) => <AdminRow key={item}><strong>{item}</strong><AdminBadge tone="danger">Safety</AdminBadge></AdminRow>)}</AdminStack>
        </AdminCard>
      </AdminGrid>
    </AdminPage>
  );
}
