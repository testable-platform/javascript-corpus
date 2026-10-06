'use strict';

/**
 * Records tide station height readings in centimetres and reports on them.
 */
class TideWatch {
  constructor(stationName) {
    this.stationName = stationName;
    this.readings = [];
  }

  /**
   * Records a single height reading in centimetres.
   */
  record(heightCm) {
    if (!Number.isFinite(heightCm)) {
      throw new TypeError('heightCm must be a finite number');
    }
    this.readings.push(heightCm);
  }

  /**
   * Returns the highest reading recorded, or null when none exist.
   */
  highWater() {
    if (this.readings.length === 0) {
      return null;
    }
    return Math.max(...this.readings);
  }

  /**
   * Returns the average reading, rounded to two decimal places.
   */
  average() {
    if (this.readings.length === 0) {
      return 0;
    }
    const sum = this.readings.reduce((total, value) => total + value, 0);
    return Math.round((sum / this.readings.length) * 100) / 100;
  }
}

module.exports = { TideWatch };
