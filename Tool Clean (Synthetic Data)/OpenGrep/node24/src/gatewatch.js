'use strict';

const crypto = require('crypto');

const ALLOWED_BADGE_IDS = new Set(['B-100', 'B-200', 'B-300']);

/**
 * Simulates a gate access controller: checks a badge against an allow
 * list and issues a one-time cryptographically random visitor code.
 */
class GateWatch {
  isAuthorized(badgeId) {
    return ALLOWED_BADGE_IDS.has(badgeId);
  }

  /**
   * Issues a six-digit visitor code using a cryptographically strong
   * source, never a predictable PRNG.
   */
  issueVisitorCode() {
    return String(crypto.randomInt(100000, 999999));
  }
}

module.exports = { GateWatch, ALLOWED_BADGE_IDS };
