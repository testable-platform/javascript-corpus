'use strict';

/**
 * Tracks aquarium water-chemistry readings (pH, ammonia, nitrite).
 */
class WaterChem {
  constructor() {
    this.readings = [];
  }

  recordReading(ph, ammoniaPpm, nitritePpm) {
    this.readings.push({ ph, ammoniaPpm, nitritePpm });
  }

  isSafe() {
    const latest = this.readings[this.readings.length - 1];
    if (!latest) {
      return false;
    }
    return latest.ph >= 6.5 && latest.ph <= 7.5
      && latest.ammoniaPpm === 0
      && latest.nitritePpm === 0;
  }
}

module.exports = { WaterChem };
