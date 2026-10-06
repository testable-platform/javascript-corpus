'use strict';

/**
 * Abandoned reporting module -- never imported from anywhere, a real
 * unused file for the knip Invalid fixture.
 */
function formatLegacyReport(catalog) {
  return `legacy report: ${catalog.size()} entries`;
}

module.exports = { formatLegacyReport };
