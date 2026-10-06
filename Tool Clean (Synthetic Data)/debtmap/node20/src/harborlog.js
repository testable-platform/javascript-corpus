'use strict';

/**
 * Records vessel arrivals and departures at a small harbor.
 */
class HarborLog {
  constructor() {
    this.berths = new Map();
  }

  /**
   * Assigns a vessel to a berth number.
   */
  arrive(vesselName, berthNumber) {
    if (this.berths.has(berthNumber)) {
      throw new Error(`berth already occupied: ${berthNumber}`);
    }
    this.berths.set(berthNumber, vesselName);
  }

  /**
   * Frees a berth and returns the vessel that had occupied it.
   */
  depart(berthNumber) {
    const vessel = this.berths.get(berthNumber);
    if (vessel === undefined) {
      return null;
    }
    this.berths.delete(berthNumber);
    return vessel;
  }

  occupiedBerths() {
    return this.berths.size;
  }
}

module.exports = { HarborLog };
