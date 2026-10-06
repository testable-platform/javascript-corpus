'use strict';

/**
 * Assigns storeroom shelf slots to labelled crates using round-robin
 * placement across a fixed number of shelves.
 */
class ShelfPlan {
  constructor(shelfCount) {
    if (!Number.isInteger(shelfCount) || shelfCount <= 0) {
      throw new RangeError('shelfCount must be a positive integer');
    }
    this.shelfCount = shelfCount;
    this.assignments = [];
  }

  /**
   * Places the next labelled crate and returns its assigned shelf index.
   */
  place(label) {
    const shelfIndex = this.assignments.length % this.shelfCount;
    this.assignments.push({ label, shelfIndex });
    return shelfIndex;
  }

  /**
   * Returns every label currently assigned to a given shelf index.
   */
  labelsOnShelf(shelfIndex) {
    return this.assignments
      .filter((entry) => entry.shelfIndex === shelfIndex)
      .map((entry) => entry.label);
  }
}

module.exports = { ShelfPlan };
