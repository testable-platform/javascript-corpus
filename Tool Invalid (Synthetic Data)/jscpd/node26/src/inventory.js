'use strict';

/**
 * A spice-inventory crate tracker.
 */
class SpiceCrate {
  constructor() {
    this.stock = new Map();
  }

  addStock(spiceName, grams) {
    if (!Number.isFinite(grams) || grams < 0) {
      throw new RangeError('grams must be a non-negative number');
    }
    const current = this.stock.get(spiceName) || 0;
    this.stock.set(spiceName, current + grams);
    return this.stock.get(spiceName);
  }

  removeStock(spiceName, grams) {
    if (!Number.isFinite(grams) || grams < 0) {
      throw new RangeError('grams must be a non-negative number');
    }
    const current = this.stock.get(spiceName) || 0;
    const next = Math.max(0, current - grams);
    this.stock.set(spiceName, next);
    return next;
  }

  totalGrams() {
    let total = 0;
    for (const value of this.stock.values()) {
      total += value;
    }
    return total;
  }
}

module.exports = { SpiceCrate };
