/** Normalize generated provider catalog headers before ts-jest parses test imports. */
module.exports = async function globalSetup() {
  await import('../../tools/normalize-provider-simulator-generated-catalogs.mjs');
};
