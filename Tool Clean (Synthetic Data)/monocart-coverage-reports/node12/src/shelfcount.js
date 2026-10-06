'use strict';

/**
 * Tracks item counts across numbered warehouse shelves.
 */
class ShelfCount {
  constructor() {
    this.counts = new Map();
  }

  /**
   * Adds a quantity to a shelf, creating it if needed.
   */
  addTo(shelfId, quantity) {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new RangeError('quantity must be a non-negative integer');
    }
    const current = this.counts.get(shelfId) || 0;
    this.counts.set(shelfId, current + quantity);
    return this.counts.get(shelfId);
  }

  /**
   * Returns the count for a shelf, or zero if it has never been touched.
   */
  countOn(shelfId) {
    return this.counts.get(shelfId) || 0;
  }

  /**
   * Returns the grand total across every shelf.
   */
  grandTotal() {
    let total = 0;
    for (const value of this.counts.values()) {
      total += value;
    }
    return total;
  }
}

module.exports = { ShelfCount };
