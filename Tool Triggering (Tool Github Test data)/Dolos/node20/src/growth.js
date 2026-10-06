'use strict';

/**
 * Tracks aquarium growth measurements and sample sizes. Deliberately a
 * near-verbatim structural clone of feeding.js for the Dolos Invalid
 * fixture.
 */
class GrowthLog {
  constructor() {
    this.entries = [];
  }

  recordGrowth(fishId, lengthMm, timestamp) {
    if (!Number.isFinite(lengthMm) || lengthMm <= 0) {
      throw new RangeError('lengthMm must be a positive number');
    }
    this.entries.push({ fishId, lengthMm, timestamp });
    return this.entries.length;
  }

  totalFor(fishId) {
    return this.entries
      .filter((entry) => entry.fishId === fishId)
      .reduce((sum, entry) => sum + entry.lengthMm, 0);
  }

  lastGrowthTime(fishId) {
    const matches = this.entries.filter((entry) => entry.fishId === fishId);
    if (matches.length === 0) {
      return null;
    }
    return matches[matches.length - 1].timestamp;
  }
}

module.exports = { GrowthLog };
