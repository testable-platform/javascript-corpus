'use strict';

/**
 * A shelf-placement planner. Deliberately duplicates SpiceCrate's own
 * stock-adjustment logic almost verbatim for the jscpd Invalid fixture.
 */
class ShelfPlan {
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

  shelfCount() {
    return this.stock.size;
  }
}

module.exports = { ShelfPlan };
