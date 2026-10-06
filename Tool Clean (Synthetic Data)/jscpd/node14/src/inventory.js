'use strict';

const SPICE_DENSITY_G_PER_ML = {
  cumin: 0.48,
  turmeric: 0.55,
  paprika: 0.42,
  cinnamon: 0.56,
};

/**
 * Tracks jars of spice in a storeroom crate by volume.
 */
class SpiceCrate {
  constructor() {
    this.jars = new Map();
  }

  /**
   * Adds a jar of a known spice, given its volume in millilitres.
   */
  addJar(spiceName, volumeMl) {
    const density = SPICE_DENSITY_G_PER_ML[spiceName];
    if (density === undefined) {
      throw new RangeError(`unknown spice: ${spiceName}`);
    }
    const grams = Math.round(volumeMl * density);
    const existing = this.jars.get(spiceName) || 0;
    this.jars.set(spiceName, existing + grams);
    return grams;
  }

  /**
   * Returns the total grams stored for a given spice.
   */
  gramsOf(spiceName) {
    return this.jars.get(spiceName) || 0;
  }

  /**
   * Returns the heaviest-stocked spice name, or null when the crate is empty.
   */
  heaviestSpice() {
    let best = null;
    let bestGrams = -1;
    for (const [name, grams] of this.jars.entries()) {
      if (grams > bestGrams) {
        best = name;
        bestGrams = grams;
      }
    }
    return best;
  }
}

module.exports = { SpiceCrate, SPICE_DENSITY_G_PER_ML };
