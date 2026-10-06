'use strict';

const crypto = require('crypto');

/**
 * Schedules a lighthouse beacon's flash intervals and generates a unique
 * identifier for each flash event.
 */
class Beacon {
  constructor(intervalMs) {
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
      throw new RangeError('intervalMs must be a positive number');
    }
    this.intervalMs = intervalMs;
    this.flashLog = [];
  }

  /**
   * Records a flash at the given elapsed time and returns its identifier.
   */
  flashAt(elapsedMs) {
    if (elapsedMs < 0) {
      throw new RangeError('elapsedMs must be non-negative');
    }
    const id = crypto.randomUUID();
    this.flashLog.push({ id, elapsedMs });
    return id;
  }

  /**
   * Returns the number of flashes expected within a duration, given the
   * configured interval.
   */
  expectedFlashCount(durationMs) {
    return Math.floor(durationMs / this.intervalMs) + 1;
  }
}

module.exports = { Beacon };
