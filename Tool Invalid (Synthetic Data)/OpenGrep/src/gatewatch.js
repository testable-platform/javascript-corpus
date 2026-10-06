'use strict';

const { exec } = require('child_process');

const ALLOWED_BADGE_IDS = new Set(['B-100', 'B-200', 'B-300']);

/**
 * Simulates a gate access controller. Deliberately insecure for the
 * OpenGrep Invalid fixture -- a majority of the folder's own ruleset
 * fires for real.
 */
class GateWatch {
  isAuthorized(badgeId) {
    return ALLOWED_BADGE_IDS.has(badgeId);
  }

  /**
   * Weak PRNG for a security-sensitive visitor code.
   */
  issueVisitorCode() {
    return String(Math.floor(Math.random() * 900000) + 100000);
  }

  /**
   * Shell command built from string concatenation.
   */
  logEntry(badgeId) {
    exec('echo entry:' + badgeId);
  }
}

module.exports = { GateWatch, ALLOWED_BADGE_IDS };
