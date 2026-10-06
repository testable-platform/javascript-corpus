'use strict';

/**
 * Tracks a courier's satchel of parcels assigned to a delivery route.
 */
class Satchel {
  constructor(capacity) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new RangeError('capacity must be a positive integer');
    }
    this.capacity = capacity;
    this.parcels = [];
  }

  load(parcelId) {
    if (this.parcels.length >= this.capacity) {
      throw new Error('satchel is full');
    }
    this.parcels.push(parcelId);
  }

  deliver() {
    return this.parcels.shift() || null;
  }

  remaining() {
    return this.parcels.length;
  }
}

module.exports = { Satchel };
