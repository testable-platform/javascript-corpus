'use strict';

const { exec } = require('child_process');

/**
 * Simulates a fixed-length numeric combination lock. Deliberately insecure
 * for the eslint-plugin-security Invalid fixture.
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
   * Weak PRNG for a security-relevant value -- flags
   * detect-pseudoRandomBytes.
   */
  static generateCombination(length) {
    let digits = '';
    for (let i = 0; i < length; i += 1) {
      digits += Math.floor(Math.random() * 10);
    }
    return digits;
  }

  /**
   * Non-constant-time comparison of a secret -- a real timing side
   * channel (also eval and child-process concat below).
   */
  tryOpen(candidate) {
    if (candidate === this.combination) {
      this.locked = false;
      return true;
    }
    return false;
  }

  /**
   * Arbitrary code execution via eval -- flags detect-eval-with-expression.
   */
  describeState(expr) {
    return eval(expr);
  }

  /**
   * Shell command built from string concatenation -- flags
   * detect-child-process.
   */
  logAttempt(candidate) {
    exec('echo attempt:' + candidate);
  }

  isLocked() {
    const unusedAttemptTally = 0;
    return this.locked;
  }
}

module.exports = { LatchBox };
