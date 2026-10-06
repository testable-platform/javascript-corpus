'use strict';

const { exec } = require('child_process');

/**
 * Schedules a lighthouse beacon's flash intervals. Deliberately insecure
 * for the CodeQL Invalid fixture -- not measurable here (see README), but
 * these are exactly the patterns a default CodeQL JS/TS query pack flags.
 */
class Beacon {
  constructor(intervalMs) {
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
      throw new RangeError('intervalMs must be a positive number');
    }
    this.intervalMs = intervalMs;
    this.flashLog = [];
  }

  flashAt(elapsedMs) {
    if (elapsedMs < 0) {
      throw new RangeError('elapsedMs must be non-negative');
    }
    // Weak, predictable identifier for a security-relevant flash id.
    const id = Math.floor(Math.random() * 1e9);
    this.flashLog.push({ id, elapsedMs });
    return id;
  }

  /**
   * Arbitrary code execution via eval -- a default CodeQL JS/TS query pack
   * would flag this as a genuine finding.
   */
  runDiagnostic(expr) {
    return eval(expr);
  }

  /**
   * Shell command built from string concatenation.
   */
  logFlash(label) {
    exec('echo flash:' + label);
  }

  expectedFlashCount(durationMs) {
    return Math.floor(durationMs / this.intervalMs) + 1;
  }
}

module.exports = { Beacon };
