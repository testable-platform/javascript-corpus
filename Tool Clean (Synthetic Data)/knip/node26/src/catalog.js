'use strict';

/**
 * A small catalog of flowers, keyed by name, with bloom-season metadata.
 */
class Catalog {
  constructor() {
    this.entries = new Map();
  }

  /**
   * Adds a flower entry with its bloom season.
   */
  addEntry(name, season) {
    this.entries.set(name, season);
  }

  /**
   * Returns every flower name that blooms in the given season.
   */
  blooming(season) {
    const names = [];
    for (const [name, entrySeason] of this.entries.entries()) {
      if (entrySeason === season) {
        names.push(name);
      }
    }
    return names.sort();
  }

  size() {
    return this.entries.size;
  }
}

module.exports = { Catalog };
