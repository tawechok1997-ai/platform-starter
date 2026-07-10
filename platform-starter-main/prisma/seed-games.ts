import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const providerSeeds = [
  { code: 'demo-provider', name: 'Demo Provider', sortOrder: 900, baseUrl: 'https://demo-provider.local', apiKey: 'demo-api-key', webhookSecret: 'demo-webhook-secret' },
  { code: 'demo-provider-uat', name: 'Demo UAT', sortOrder: 905, baseUrl: 'https://demo-provider-uat.local', apiKey: 'demo-uat-api-key', webhookSecret: 'demo-uat-webhook-secret' },
  { code: 'simulator-provider', name: 'Simulator Provider', sortOrder: 910, baseUrl: 'https://simulator-provider.local', apiKey: 'simulator-api-key', webhookSecret: 'simulator-webhook-secret' },
];

async function upsertProvider(seed: (typeof providerSeeds)[number]) {
  const provider = await prisma.gameProvider.upsert({
    where: { code: seed.code },
    update: { name: seed.name, status: 'ACTIVE', walletMode: 'TRANSFER', currency: 'THB', timezone: 'Asia/Bangkok', metadata: { note: `${seed.name} for dry-run game platform testing.`, launchEnabled: true, transferEnabled: true, realMoneyEnabled: false, webhookSettlementEnabled: false } },
    create: { name: seed.name, code: seed.code, status: 'ACTIVE', walletMode: 'TRANSFER', currency: 'THB', timezone: 'Asia/Bangkok', sortOrder: seed.sortOrder, metadata: { note: `${seed.name} for dry-run game platform testing.`, launchEnabled: true, transferEnabled: true, realMoneyEnabled: false, webhookSettlementEnabled: false } },
  });

  const endpoints = [
    { type: 'LAUNCH' as const, url: `${seed.baseUrl}/launch`, method: 'POST' },
    { type: 'BALANCE' as const, url: `${seed.baseUrl}/balance`, method: 'POST' },
    { type: 'TRANSFER_IN' as const, url: `${seed.baseUrl}/transfer-in`, method: 'POST' },
    { type: 'TRANSFER_OUT' as const, url: `${seed.baseUrl}/transfer-out`, method: 'POST' },
    { type: 'WEBHOOK' as const, url: `${seed.baseUrl}/webhook`, method: 'POST' },
    { type: 'HEALTH_CHECK' as const, url: `${seed.baseUrl}/health`, method: 'GET' },
  ];

  for (const endpoint of endpoints) {
    await prisma.gameProviderEndpoint.upsert({
      where: { providerId_type: { providerId: provider.id, type: endpoint.type } },
      update: { url: endpoint.url, method: endpoint.method, timeoutMs: 10000, retryCount: 1, isEnabled: true },
      create: { providerId: provider.id, type: endpoint.type, url: endpoint.url, method: endpoint.method, timeoutMs: 10000, retryCount: 1, isEnabled: true },
    });
  }

  const credentials = [
    { type: 'API_KEY' as const, encryptedValue: seed.apiKey, maskedValue: seed.apiKey },
    { type: 'WEBHOOK_SECRET' as const, encryptedValue: seed.webhookSecret, maskedValue: seed.webhookSecret },
  ];

  for (const credential of credentials) {
    await prisma.gameProviderCredential.upsert({
      where: { providerId_type: { providerId: provider.id, type: credential.type } },
      update: { encryptedValue: credential.encryptedValue, maskedValue: credential.maskedValue, isEnabled: true, rotatedAt: new Date() },
      create: { providerId: provider.id, type: credential.type, encryptedValue: credential.encryptedValue, maskedValue: credential.maskedValue, isEnabled: true, rotatedAt: new Date() },
    });
  }

  return provider;
}

async function main() {
  const providers = [];
  for (const seed of providerSeeds) providers.push(await upsertProvider(seed));

  const games = [
    { providerGameCode: 'demo-slot-001', name: 'Demo Fortune Slot', category: 'slot', isFeatured: true, isNew: true, isPopular: true, sortOrder: 10, imageUrl: 'https://placehold.co/600x400?text=Demo+Slot' },
    { providerGameCode: 'demo-casino-001', name: 'Demo Live Table', category: 'casino', isFeatured: false, isNew: true, isPopular: true, sortOrder: 20, imageUrl: 'https://placehold.co/600x400?text=Demo+Casino' },
  ];

  for (const provider of providers) {
    for (const game of games) {
      await prisma.game.upsert({
        where: { providerId_providerGameCode: { providerId: provider.id, providerGameCode: game.providerGameCode } },
        update: { name: game.name, category: game.category, status: 'ACTIVE', isFeatured: game.isFeatured, isNew: game.isNew, isPopular: game.isPopular, sortOrder: game.sortOrder, metadata: { imageUrl: game.imageUrl } },
        create: { providerId: provider.id, providerGameCode: game.providerGameCode, name: game.name, category: game.category, status: 'ACTIVE', isFeatured: game.isFeatured, isNew: game.isNew, isPopular: game.isPopular, sortOrder: game.sortOrder, metadata: { imageUrl: game.imageUrl } },
      });
    }
  }

  console.log('Demo, UAT, and simulator game seed completed');
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
