import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { createCipheriv, createHash, randomBytes } from 'crypto';

const prisma = new PrismaClient();

const permissions = [
  ['users.view', 'Users View', 'users'],
  ['users.update', 'Users Update', 'users'],
  ['users.suspend', 'Users Suspend', 'users'],
  ['wallet.view', 'Wallet View', 'wallet'],
  ['topups.view', 'Top Ups View', 'topups'],
  ['topups.review', 'Top Ups Review', 'topups'],
  ['topups.approve', 'Top Ups Approve', 'topups'],
  ['topups.reject', 'Top Ups Reject', 'topups'],
  ['deposit.view', 'Deposit View', 'deposit'],
  ['deposit.claim', 'Deposit Claim', 'deposit'],
  ['deposit.approve', 'Deposit Approve', 'deposit'],
  ['deposit.reject', 'Deposit Reject', 'deposit'],
  ['withdraw.view', 'Withdraw View', 'withdraw'],
  ['withdraw.claim', 'Withdraw Claim', 'withdraw'],
  ['withdraw.success', 'Withdraw Success', 'withdraw'],
  ['withdraw.reject', 'Withdraw Reject', 'withdraw'],
  ['risk.view', 'Risk View', 'risk'],
  ['risk.resolve', 'Risk Resolve', 'risk'],
  ['provider.view', 'Provider View', 'provider'],
  ['provider.update', 'Provider Update', 'provider'],
  ['game.providers.view', 'Game Providers View', 'game-platform'],
  ['game.providers.manage', 'Game Providers Manage', 'game-platform'],
  ['promotion.view', 'Promotion View', 'promotion'],
  ['promotion.create', 'Promotion Create', 'promotion'],
  ['seo.view', 'SEO View', 'seo'],
  ['seo.update', 'SEO Update', 'seo'],
  ['admin.view', 'Admin View', 'admin'],
  ['admin.create', 'Admin Create', 'admin'],
  ['admin.access.view', 'Admin Access View', 'admin'],
  ['admin.access.manage', 'Admin Access Manage', 'admin'],
  ['roles.update', 'Roles Update', 'admin'],
  ['settings.update', 'Settings Update', 'settings'],
  ['settings.website.view', 'Website Settings View', 'settings'],
  ['settings.website.update', 'Website Settings Update', 'settings'],
  ['settings.branding.view', 'Branding Settings View', 'settings'],
  ['settings.branding.update', 'Branding Settings Update', 'settings'],
  ['settings.theme.view', 'Theme Settings View', 'settings'],
  ['settings.theme.update', 'Theme Settings Update', 'settings'],
  ['settings.seo.view', 'SEO Settings View', 'settings'],
  ['settings.seo.update', 'SEO Settings Update', 'settings'],
  ['settings.contact.view', 'Contact Settings View', 'settings'],
  ['settings.contact.update', 'Contact Settings Update', 'settings'],
  ['settings.maintenance.view', 'Maintenance Settings View', 'settings'],
  ['settings.maintenance.update', 'Maintenance Settings Update', 'settings'],
  ['settings.scripts.view', 'Script Settings View', 'settings'],
  ['settings.scripts.update', 'Script Settings Update', 'settings'],
  ['settings.features.view', 'Feature Settings View', 'settings'],
  ['settings.features.update', 'Feature Settings Update', 'settings'],
  ['settings.legal.view', 'Legal Settings View', 'settings'],
  ['settings.legal.update', 'Legal Settings Update', 'settings'],
  ['reports.view', 'Reports View', 'reports'],
  ['reports.export', 'Reports Export', 'reports'],
] as const;

const defaultSettings = [
  ['website.site_name', 'Platform Starter', 'WEBSITE', 'STRING', true, false],
  ['website.site_description', 'Member platform starter', 'WEBSITE', 'STRING', true, false],
  ['website.site_url', 'https://platformweb-member-production.up.railway.app', 'WEBSITE', 'URL', true, false],
  ['website.admin_url', 'https://platformweb-admin-production.up.railway.app', 'WEBSITE', 'URL', false, false],
  ['website.default_language', 'th', 'WEBSITE', 'STRING', true, false],
  ['website.timezone', 'Asia/Bangkok', 'WEBSITE', 'STRING', true, false],
  ['website.currency', 'THB', 'WEBSITE', 'STRING', true, false],
  ['website.date_format', 'DD/MM/YYYY', 'WEBSITE', 'STRING', true, false],
  ['website.maintenance_mode', false, 'WEBSITE', 'BOOLEAN', true, false],
  ['website.registration_enabled', true, 'WEBSITE', 'BOOLEAN', true, false],
  ['website.login_enabled', true, 'WEBSITE', 'BOOLEAN', true, false],
  ['branding.primary_color', '#f5c542', 'BRANDING', 'COLOR', true, false],
  ['branding.background_color', '#080808', 'BRANDING', 'COLOR', true, false],
  ['branding.card_color', '#181818', 'BRANDING', 'COLOR', true, false],
  ['branding.text_color', '#ffffff', 'BRANDING', 'COLOR', true, false],
  ['branding.success_color', '#22c55e', 'BRANDING', 'COLOR', true, false],
  ['branding.danger_color', '#ef4444', 'BRANDING', 'COLOR', true, false],
  ['theme.show_balance_header', true, 'THEME', 'BOOLEAN', true, false],
  ['theme.show_deposit_withdraw_buttons', true, 'THEME', 'BOOLEAN', true, false],
  ['theme.show_promotion_banner', true, 'THEME', 'BOOLEAN', true, false],
  ['seo.default_title', 'Platform Starter', 'SEO', 'STRING', true, false],
  ['seo.default_description', 'Platform starter website', 'SEO', 'STRING', true, false],
  ['contact.support_hours', '24/7', 'CONTACT', 'STRING', true, false],
  ['maintenance.enabled', false, 'MAINTENANCE', 'BOOLEAN', true, false],
  ['maintenance.member_enabled', false, 'MAINTENANCE', 'BOOLEAN', true, false],
  ['maintenance.deposit_enabled', false, 'MAINTENANCE', 'BOOLEAN', true, false],
  ['maintenance.withdraw_enabled', false, 'MAINTENANCE', 'BOOLEAN', true, false],
  ['features.registration_enabled', true, 'FEATURES', 'BOOLEAN', true, false],
  ['features.login_enabled', true, 'FEATURES', 'BOOLEAN', true, false],
  ['features.deposit_enabled', true, 'FEATURES', 'BOOLEAN', true, false],
  ['features.withdraw_enabled', true, 'FEATURES', 'BOOLEAN', true, false],
  ['features.promotion_enabled', true, 'FEATURES', 'BOOLEAN', true, false],
  ['legal.terms', '', 'LEGAL', 'RICH_TEXT', true, false],
  ['legal.privacy', '', 'LEGAL', 'RICH_TEXT', true, false],
] as const;

async function main() {
  for (const [code, name, module] of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { name, module },
      create: { code, name, module },
    });
  }

  const superAdminRole = await prisma.role.upsert({
    where: { code: 'super_admin' },
    update: { name: 'Super Admin', level: 1 },
    create: { code: 'super_admin', name: 'Super Admin', level: 1 },
  });

  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: permission.id },
    });
  }

  const firstAdminSecret = process.env.DEFAULT_ADMIN_SECRET ?? 'ChangeThisLocalOnly123!';
  const firstAdmin = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', email: 'admin@example.local', passwordHash: await argon2.hash(firstAdminSecret), twoFactorEnabled: false },
  });

  await prisma.adminUserRole.upsert({
    where: { adminUserId_roleId: { adminUserId: firstAdmin.id, roleId: superAdminRole.id } },
    update: {},
    create: { adminUserId: firstAdmin.id, roleId: superAdminRole.id },
  });

  for (const [key, valueJson, group, type, isPublic, isSensitive] of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: {},
      create: { key, valueJson, group: group as any, type: type as any, isPublic, isSensitive, updatedBy: firstAdmin.id },
    });
  }

  await seedSampleGameProvider();

  console.log('Seed completed');
}

async function seedSampleGameProvider() {
  const provider = await prisma.gameProvider.upsert({
    where: { code: 'demo-provider' },
    update: { name: 'Demo Provider', status: 'INACTIVE', walletMode: 'TRANSFER', currency: 'THB', timezone: 'Asia/Bangkok' },
    create: { name: 'Demo Provider', code: 'demo-provider', status: 'INACTIVE', walletMode: 'TRANSFER', currency: 'THB', timezone: 'Asia/Bangkok', sortOrder: 900, metadata: { note: 'Local/demo provider only. Replace endpoints and credentials before production.' } },
  });

  const endpointBase = process.env.DEMO_PROVIDER_BASE_URL ?? 'https://provider.example.local/api';
  const endpoints = [
    ['LAUNCH', `${endpointBase}/launch`],
    ['BALANCE', `${endpointBase}/balance`],
    ['TRANSFER_IN', `${endpointBase}/transfer/in`],
    ['TRANSFER_OUT', `${endpointBase}/transfer/out`],
    ['GAME_LIST', `${endpointBase}/games`],
    ['WEBHOOK', `${endpointBase}/webhook`],
  ] as const;

  for (const [type, url] of endpoints) {
    await prisma.gameProviderEndpoint.upsert({
      where: { providerId_type: { providerId: provider.id, type: type as any } },
      update: { url, method: 'POST', timeoutMs: 10000, retryCount: 2, isEnabled: false },
      create: { providerId: provider.id, type: type as any, url, method: 'POST', timeoutMs: 10000, retryCount: 2, isEnabled: false },
    });
  }

  const secret = process.env.DEMO_PROVIDER_API_KEY ?? 'demo-provider-api-key-change-me';
  await prisma.gameProviderCredential.upsert({
    where: { providerId_type: { providerId: provider.id, type: 'API_KEY' as any } },
    update: { encryptedValue: encryptSeedSecret(secret), maskedValue: maskSecret(secret), isEnabled: false, rotatedAt: new Date() },
    create: { providerId: provider.id, type: 'API_KEY' as any, encryptedValue: encryptSeedSecret(secret), maskedValue: maskSecret(secret), isEnabled: false, rotatedAt: new Date() },
  });
}

function encryptSeedSecret(value: string) {
  const keySource = process.env.GAME_CREDENTIAL_SECRET ?? process.env.JWT_ACCESS_KEY ?? 'local_game_credential_key';
  const key = createHash('sha256').update(keySource).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `aes-256-gcm:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

function maskSecret(value: string) {
  if (value.length <= 8) return `${value.slice(0, 1)}••••${value.slice(-1)}`;
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });