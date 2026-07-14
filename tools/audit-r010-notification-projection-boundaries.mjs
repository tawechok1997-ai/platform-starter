import fs from 'node:fs';

const projectionPath = 'apps/api/src/modules/notifications/notification-read.projections.ts';
const repositoryPath = 'apps/api/src/modules/notifications/notification-feed-read.repository.ts';
const servicePath = 'apps/api/src/modules/notifications/notifications-query.service.ts';

const projectionSource = fs.readFileSync(projectionPath, 'utf8');
const repositorySource = fs.readFileSync(repositoryPath, 'utf8');
const serviceSource = fs.readFileSync(servicePath, 'utf8');

const requiredProjectionContracts = [
  'TOP_UP_NOTIFICATION_LIST_PROJECTION',
  'WITHDRAWAL_NOTIFICATION_LIST_PROJECTION',
  'SUPPORT_NOTIFICATION_LIST_PROJECTION',
  'LOGIN_NOTIFICATION_LIST_PROJECTION',
  'NOTIFICATION_STATE_LIST_PROJECTION',
  'NOTIFICATION_PREFERENCE_DETAIL_PROJECTION',
  'NOTIFICATION_CHANNEL_DETAIL_PROJECTION',
  'buildNotificationFeedSummary',
];

const missingProjectionContracts = requiredProjectionContracts.filter((name) => !projectionSource.includes(name));
const repositoryContracts = requiredProjectionContracts.filter((name) => name !== 'buildNotificationFeedSummary');
const missingRepositoryUsage = repositoryContracts.filter((name) => !repositorySource.includes(name));

const errors = [];
if (missingProjectionContracts.length) errors.push(`missing projection contracts: ${missingProjectionContracts.join(', ')}`);
if (missingRepositoryUsage.length) errors.push(`repository does not use: ${missingRepositoryUsage.join(', ')}`);
if (/PrismaService|this\.prisma/.test(serviceSource)) errors.push('NotificationsQueryService must not access Prisma directly');
if (!serviceSource.includes('buildNotificationFeedSummary')) errors.push('NotificationsQueryService must use the summary projection helper');
if (!serviceSource.includes('loadMemberFeedState')) errors.push('notification state list read must route through the read repository');
if (!serviceSource.includes('loadMemberPreferenceDetail')) errors.push('preference detail read must route through the read repository');

if (errors.length) {
  console.error('R-010 notification projection boundary failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('R-010 notification projection boundary passed.');
