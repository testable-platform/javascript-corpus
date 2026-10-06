'use strict';

const minimist = require('minimist');

/**
 * Tracks item counts inside a labelled shipping crate, parsing CLI-style
 * key=value overrides via minimist.
 */
class CrateBox {
  constructor(label) {
    this.label = label;
    this.items = new Map();
  }

  addItem(sku, quantity) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new RangeError('quantity must be a positive integer');
    }
    const current = this.items.get(sku) || 0;
    this.items.set(sku, current + quantity);
  }

  quantityOf(sku) {
    return this.items.get(sku) || 0;
  }

  applyOverrides(argv) {
    return minimist(argv);
  }
}

module.exports = { CrateBox };
