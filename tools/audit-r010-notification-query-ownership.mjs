import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const repositoryPath = path.join(root, 'apps/api/src/modules/notifications/notification-feed-read.repository.ts');
const servicePath = path.join(root, 'apps/api/src/modules/notifications/notifications-query.service.ts');
const modulePath = path.join(root, 'apps/api/src/modules/notifications/notifications.module.ts');

const failures = [];
for (const file of [repositoryPath, servicePath, modulePath]) {
  if (!fs.existsSync(file)) failures.push(`missing required file: ${path.relative(root, file)}`);
}

const repository = fs.existsSync(repositoryPath) ? fs.readFileSync(repositoryPath, 'utf8') : '';
const service = fs.existsSync(servicePath) ? fs.readFileSync(servicePath, 'utf8') : '';
const moduleSource = fs.existsSync(modulePath) ? fs.readFileSync(modulePath, 'utf8') : '';

const requiredRepositorySignals = [
  'export class NotificationFeedReadRepository',
  'NOTIFICATION_FEED_SOURCE_LIMIT',
  'loadMemberFeedSources(userId: string)',
  'this.prisma.topUpRequest.findMany',
  'this.prisma.withdrawalRequest.findMany',
  'this.prisma.riskAlert.findMany',
  'this.prisma.loginHistory.findMany',
  'select: TOP_UP_NOTIFICATION_LIST_PROJECTION',
  'select: WITHDRAWAL_NOTIFICATION_LIST_PROJECTION',
  'select: SUPPORT_NOTIFICATION_LIST_PROJECTION',
  'select: LOGIN_NOTIFICATION_LIST_PROJECTION',
];

for (const signal of requiredRepositorySignals) {
  if (!repository.includes(signal)) failures.push(`notification feed repository missing signal: ${signal}`);
}

if (!service.includes('private readonly feedRepository: NotificationFeedReadRepository')) {
  failures.push('NotificationsQueryService does not receive the notification feed repository');
}
if (!service.includes('this.feedRepository.loadMemberFeedSources(userId)')) {
  failures.push('NotificationsQueryService does not route feed reads through the repository');
}
if (!service.includes('this.feedRepository.loadMemberFeedState(userId')) {
  failures.push('NotificationsQueryService does not route feed-state reads through the repository');
}
if (!service.includes('this.feedRepository.loadMemberPreferenceDetail(')) {
  failures.push('NotificationsQueryService does not route preference reads through the repository');
}

for (const model of ['topUpRequest', 'withdrawalRequest', 'riskAlert', 'loginHistory', 'notificationState', 'notificationPreference', 'siteSetting']) {
  if (service.includes(`this.prisma.${model}.`)) {
    failures.push(`NotificationsQueryService still owns ${model} queries directly`);
  }
}

if (!moduleSource.includes('NotificationFeedReadRepository')) {
  failures.push('NotificationsModule does not register NotificationFeedReadRepository');
}

if (failures.length > 0) {
  console.error('R-010 notification query ownership audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R-010 notification query ownership audit passed. Feed, state, and preference reads are consolidated under the notifications repository owner.');
