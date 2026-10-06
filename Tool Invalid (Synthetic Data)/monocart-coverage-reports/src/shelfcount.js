'use strict';

/**
 * Tracks item counts across numbered warehouse shelves. Deliberately
 * under-tested for the monocart-coverage-reports Invalid fixture.
 */
class ShelfCount {
  constructor() {
    this.counts = new Map();
  }

  addTo(shelfId, quantity) {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new RangeError('quantity must be a non-negative integer');
    }
    const current = this.counts.get(shelfId) || 0;
    this.counts.set(shelfId, current + quantity);
    return this.counts.get(shelfId);
  }

  countOn(shelfId) {
    return this.counts.get(shelfId) || 0;
  }

  grandTotal() {
    let total = 0;
    for (const value of this.counts.values()) {
      total += value;
    }
    return total;
  }

  isOverCapacity(shelfId, capacity) {
    if (this.countOn(shelfId) > capacity) {
      return true;
    }
    return false;
  }
}

module.exports = { ShelfCount };
