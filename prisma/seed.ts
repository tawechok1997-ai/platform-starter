import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { createCipheriv, createHash, randomBytes } from 'crypto';
import { PROMOTION_ASSET_CAMPAIGNS } from '../apps/api/src/modules/promotions/promotion-asset-campaigns';

const prisma = new PrismaClient();

const permissions = [
  ['users.view', 'Users View', 'users'],
  ['users.update', 'Users Update', 'users'],
  ['users.suspend', 'Users Suspend', 'users'],
  ['wallet.view', 'Wallet View', 'wallet'],
  ['wallet.adjust', 'Wallet Adjust', 'wallet'],
  ['bank_accounts.view', 'Bank Accounts View', 'bank-accounts'],
  ['bank_accounts.manage', 'Bank Accounts Manage', 'bank-accounts'],
  ['bank_accounts.review', 'Bank Accounts Review', 'bank-accounts'],
  ['support.view', 'Support Tickets View', 'support'],
  ['support.reply', 'Support Tickets Reply', 'support'],
  ['support.manage', 'Support Tickets Manage', 'support'],
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
  ['risk.assign', 'Risk Assign', 'risk'],
  ['risk.note', 'Risk Notes', 'risk'],
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
  ['settings.branding.update', 'Branding Settings Draft/Edit', 'settings'],
  ['settings.branding.publish', 'Branding Settings Publish/Rollback', 'settings'],
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
  ['security.anti_bot.view', 'Anti-bot Settings View', 'security'],
  ['security.anti_bot.update', 'Anti-bot Settings Update', 'security'],
  ['security.anti_bot.test', 'Anti-bot Provider Test', 'security'],
  ['security.anti_bot.override', 'Anti-bot Emergency Override', 'security'],
  ['reports.view', 'Reports View', 'reports'],
  ['reports.export', 'Reports Export', 'reports'],
] as const;

const MEMBER_HOME_LEADERBOARD = [
  {
    rank: 1,
    name: 'Golden Empire',
    user: '092XXXX986',
    amount: '฿1,995',
    image: '/assets/asset-pc/images/games/1670596360948-8b1915ee-c2d6-4fb0-b22c-0c7fb32b0117.png',
  },
  {
    rank: 2,
    name: 'Maya Golden City',
    user: '093XXXX510',
    amount: '฿1,200',
    image: '/assets/asset-pc/images/games/1667928508204-7c69c936-becb-4ed3-9371-6ddb13bf9202.png',
  },
  {
    rank: 3,
    name: 'Fortune Rabbit',
    user: '064XXXX667',
    amount: '฿809',
    image: '/assets/asset-pc/images/games/1671503437258-6858b67e-74b0-4f92-a2c1-0baa9b8ce8a5.png',
  },
  {
    rank: 4,
    name: 'Fortune Gems',
    user: '081XXXX589',
    amount: '฿640',
    image: '/assets/asset-pc/images/games/1670762884919-364a6e35-5fe4-41f9-8ce7-892e9e2ac9b6.png',
  },
  {
    rank: 5,
    name: 'Caishen Wins',
    user: '096XXXX449',
    amount: '฿560',
    image: '/assets/asset-pc/images/games/1667451216350-67ca671b-fac7-444c-9dff-c09d9524ee0e.png',
  },
];

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
  ['features.quick_promotion_title', 'โปรโมชั่นพิเศษ', 'FEATURES', 'STRING', true, false],
  ['features.quick_promotion_summary', 'โปรโมชั่นพิเศษเฉพาะคุณ', 'FEATURES', 'STRING', true, false],
  ['features.quick_activity_title', 'กิจกรรม', 'FEATURES', 'STRING', true, false],
  ['features.quick_activity_summary', 'กิจกรรมตลอด 24 ชั่วโมง', 'FEATURES', 'STRING', true, false],
  ['features.quick_news_title', 'ข่าวสาร', 'FEATURES', 'STRING', true, false],
  ['features.quick_news_summary', 'ข่าวสารที่คุณไม่ควรพลาด', 'FEATURES', 'STRING', true, false],
  ['features.jackpot_title', 'Jackpot', 'FEATURES', 'STRING', true, false],
  ['features.jackpot_subtitle', 'Epic of the day', 'FEATURES', 'STRING', true, false],
  ['features.jackpot_image_url', '/assets/asset-pc/images/FEZX/highlight/1725948738165-4cb4f1ec-44ed-4b21-99ed-398fbb6d7b25.gif', 'FEATURES', 'URL', true, false],
  ['features.leaderboard_title', 'Leaderboard', 'FEATURES', 'STRING', true, false],
  ['features.leaderboard_limit', 5, 'FEATURES', 'NUMBER', true, false],
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

  for (const [key, valueJson, group, type, isPublic, isSensitive] of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { valueJson, group, type, isPublic, isSensitive },
      create: { key, valueJson, group, type, isPublic, isSensitive },
    });
  }

  await prisma.siteSetting.upsert({
    where: { key: 'features.promotion_campaigns' },
    update: {},
    create: {
      key: 'features.promotion_campaigns',
      valueJson: JSON.parse(JSON.stringify(PROMOTION_ASSET_CAMPAIGNS)),
      group: 'FEATURES',
      type: 'JSON',
      isPublic: true,
      isSensitive: false,
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: 'features.leaderboard_items' },
    update: {
      valueJson: JSON.parse(JSON.stringify(MEMBER_HOME_LEADERBOARD)),
      group: 'FEATURES',
      type: 'JSON',
      isPublic: true,
      isSensitive: false,
    },
    create: {
      key: 'features.leaderboard_items',
      valueJson: JSON.parse(JSON.stringify(MEMBER_HOME_LEADERBOARD)),
      group: 'FEATURES',
      type: 'JSON',
      isPublic: true,
      isSensitive: false,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
