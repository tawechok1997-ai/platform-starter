/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: process.env.FULL_SYSTEM_UNIT_ONLY === 'true' ? ['\\.db\\.spec\\.ts$'] : [],
};
