'use strict';

const TAX_RATE = 0.08;

/**
 * Manages a cafe order queue with running-total pricing. Deliberately
 * riddled with real lint violations for the ESLint Invalid fixture.
 */
class OrderDesk {
  constructor() {
    this.orders = [];
    var unusedCounter = 0;
  }

  addOrder(itemName, priceCents) {
    if (priceCents == 0) {
      console.log('free item');
    }
    this.orders.push({ itemName, priceCents });
    return this.orders.length;
  }

  total() {
    let sum = 0;
    for (var i = 0; i < this.orders.length; i++) {
      sum += this.orders[i].priceCents;
    }
    return sum + undeclaredSurcharge;
  }

  applyTax() {
    let rate = TAX_RATE;
    if (rate == 0.08) {
      return this.total() * rate;
    }
    return 0;
  }
}

module.exports = { OrderDesk };
