import fs from 'node:fs';

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const failures = [];
const targets = [
  {
    label: 'admin',
    route: 'apps/web-admin/app/(admin)/kyc-center/page.tsx',
    feature: 'apps/web-admin/src/features/kyc/kyc-center-page.tsx',
    client: 'apps/web-admin/app/(admin)/kyc-center/kyc-center-client.tsx',
    entry: 'apps/web-admin/src/features/kyc/index.ts',
    routeImport: "from '../../../src/features/kyc/kyc-center-page'",
    featureImport: "from '../../../app/(admin)/kyc-center/kyc-center-client'",
    apiMarker: 'adminApiFetch(',
    exported: 'KycCenterPage',
  },
  {
    label: 'member',
    route: 'apps/web-member/app/kyc/page.tsx',
    feature: 'apps/web-member/src/features/kyc/member-kyc-page.tsx',
    client: 'apps/web-member/app/kyc/kyc-client.tsx',
    entry: 'apps/web-member/src/features/kyc/index.ts',
    routeImport: "from '../../src/features/kyc/member-kyc-page'",
    featureImport: "from '../../../app/kyc/kyc-client'",
    apiMarker: 'memberApiFetch(',
    exported: 'MemberKycPage',
  },
];

for (const target of targets) {
  const route = read(target.route);
  const feature = read(target.feature);
  const client = read(target.client);
  const entry = read(target.entry);
  if (!fs.existsSync(target.feature)) failures.push(`${target.label}: missing KYC feature wrapper`);
  if (!fs.existsSync(target.client)) failures.push(`${target.label}: missing KYC client implementation`);
  if (!route.includes(target.routeImport)) failures.push(`${target.label}: KYC route must delegate to feature boundary`);
  if (route.includes('ApiFetch(') || route.includes('useState(') || route.includes('useEffect(')) failures.push(`${target.label}: KYC route must remain thin`);
  if (!feature.includes(target.featureImport)) failures.push(`${target.label}: KYC feature must delegate to client implementation`);
  if (!client.includes(target.apiMarker) || !client.includes('useState(')) failures.push(`${target.label}: KYC client must own API and state orchestration`);
  if (!entry.includes(target.exported)) failures.push(`${target.label}: KYC public boundary must export ${target.exported}`);
}

if (failures.length) {
  console.error('R-012 KYC boundary audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('R-012 KYC boundary audit passed.');
