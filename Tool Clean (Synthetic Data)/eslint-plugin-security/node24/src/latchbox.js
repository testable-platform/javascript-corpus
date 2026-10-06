'use strict';

const crypto = require('crypto');

/**
 * Simulates a fixed-length numeric combination lock.
 */
class LatchBox {
  constructor(combinationLength) {
    if (!Number.isInteger(combinationLength) || combinationLength <= 0) {
      throw new RangeError('combinationLength must be a positive integer');
    }
    this.combinationLength = combinationLength;
    this.combination = LatchBox.generateCombination(combinationLength);
    this.locked = true;
  }

  /**
   * Produces a random numeric combination of the requested length using a
   * cryptographically strong source, avoiding weak PRNGs entirely.
   */
  static generateCombination(length) {
    const digits = [];
    for (let i = 0; i < length; i += 1) {
      digits.push(crypto.randomInt(0, 10));
    }
    return digits.join('');
  }

  /**
   * Attempts to open the lock with a candidate combination, comparing in
   * constant time to avoid leaking timing information.
   */
  tryOpen(candidate) {
    if (typeof candidate !== 'string' || candidate.length !== this.combinationLength) {
      return false;
    }
    const expected = Buffer.from(this.combination, 'utf8');
    const given = Buffer.from(candidate, 'utf8');
    if (expected.length !== given.length) {
      return false;
    }
    const matches = crypto.timingSafeEqual(expected, given);
    if (matches) {
      this.locked = false;
    }
    return matches;
  }

  isLocked() {
    return this.locked;
  }
}

module.exports = { LatchBox };
