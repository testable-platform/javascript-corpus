'use strict';

/**
 * Tracks aquarium feeding schedules and portion sizes.
 */
class FeedingLog {
  constructor() {
    this.entries = [];
  }

  recordFeeding(fishId, portionGrams, timestamp) {
    if (!Number.isFinite(portionGrams) || portionGrams <= 0) {
      throw new RangeError('portionGrams must be a positive number');
    }
    this.entries.push({ fishId, portionGrams, timestamp });
    return this.entries.length;
  }

  totalFor(fishId) {
    return this.entries
      .filter((entry) => entry.fishId === fishId)
      .reduce((sum, entry) => sum + entry.portionGrams, 0);
  }

  lastFeedingTime(fishId) {
    const matches = this.entries.filter((entry) => entry.fishId === fishId);
    if (matches.length === 0) {
      return null;
    }
    return matches[matches.length - 1].timestamp;
  }
}

module.exports = { FeedingLog };
