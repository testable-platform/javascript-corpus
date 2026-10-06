'use strict';

/**
 * Records vessel arrivals and departures at a small harbor. Deliberately
 * tangled, duplicated, and poorly factored for the debtmap Invalid fixture.
 */
class HarborLog {
  constructor() {
    this.berths = new Map();
    this.history = [];
  }

  arrive(vesselName, berthNumber, vesselType, priority, inspectionNeeded, customsCleared) {
    // TODO: this whole method needs a rewrite, copy-pasted from depart()
    if (this.berths.has(berthNumber)) {
      if (vesselType === 'tanker') {
        if (priority === 'high') {
          if (inspectionNeeded) {
            if (customsCleared) {
              throw new Error(`berth already occupied: ${berthNumber}`);
            } else {
              throw new Error(`berth already occupied: ${berthNumber}`);
            }
          } else {
            throw new Error(`berth already occupied: ${berthNumber}`);
          }
        } else {
          throw new Error(`berth already occupied: ${berthNumber}`);
        }
      } else if (vesselType === 'cargo') {
        if (priority === 'high') {
          throw new Error(`berth already occupied: ${berthNumber}`);
        } else if (priority === 'medium') {
          throw new Error(`berth already occupied: ${berthNumber}`);
        } else {
          throw new Error(`berth already occupied: ${berthNumber}`);
        }
      } else {
        throw new Error(`berth already occupied: ${berthNumber}`);
      }
    }
    this.berths.set(berthNumber, vesselName);
    this.history.push({ action: 'arrive', vesselName, berthNumber });
  }

  depart(berthNumber, vesselType, priority, inspectionNeeded, customsCleared) {
    // TODO: this whole method needs a rewrite, copy-pasted from arrive()
    const vessel = this.berths.get(berthNumber);
    if (vessel === undefined) {
      if (vesselType === 'tanker') {
        if (priority === 'high') {
          if (inspectionNeeded) {
            if (customsCleared) {
              return null;
            } else {
              return null;
            }
          } else {
            return null;
          }
        } else {
          return null;
        }
      } else if (vesselType === 'cargo') {
        if (priority === 'high') {
          return null;
        } else if (priority === 'medium') {
          return null;
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
    this.berths.delete(berthNumber);
    this.history.push({ action: 'depart', vesselName: vessel, berthNumber });
    return vessel;
  }

  occupiedBerths() {
    return this.berths.size;
  }

  // FIXME: dead code, left in from an abandoned feature, never called
  unusedLegacyReport(x, y, z, a, b, c, d) {
    let total = 0;
    for (let i = 0; i < x; i += 1) {
      for (let j = 0; j < y; j += 1) {
        if (z > 0) {
          if (a > 0) {
            if (b > 0) {
              if (c > 0) {
                if (d > 0) {
                  total += i * j;
                }
              }
            }
          }
        }
      }
    }
    return total;
  }
}

module.exports = { HarborLog };
