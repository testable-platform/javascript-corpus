'use strict';

/**
 * Cafe order queue. Tracks pending orders and computes a running total.
 */
class OrderDesk {
  constructor() {
    this.orders = [];
  }

  /**
   * Adds an order with a name and a price in cents.
   */
  addOrder(name, priceCents) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new TypeError('name must be a non-empty string');
    }
    if (!Number.isInteger(priceCents) || priceCents < 0) {
      throw new RangeError('priceCents must be a non-negative integer');
    }
    this.orders.push({ name, priceCents });
    return this.orders.length;
  }

  /**
   * Returns the running total, in cents, of every order added so far.
   */
  runningTotal() {
    let total = 0;
    for (const order of this.orders) {
      total += order.priceCents;
    }
    return total;
  }

  /**
   * Removes and returns the oldest order, or null when the queue is empty.
   */
  takeNext() {
    if (this.orders.length === 0) {
      return null;
    }
    return this.orders.shift();
  }
}

module.exports = { OrderDesk };
