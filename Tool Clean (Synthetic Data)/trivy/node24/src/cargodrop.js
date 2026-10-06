'use strict';

/**
 * Schedules cargo drop-off slots across a fixed number of loading docks.
 */
class CargoDrop {
  constructor(dockCount) {
    if (!Number.isInteger(dockCount) || dockCount <= 0) {
      throw new RangeError('dockCount must be a positive integer');
    }
    this.dockCount = dockCount;
    this.schedule = [];
  }

  scheduleDrop(label) {
    const dockIndex = this.schedule.length % this.dockCount;
    this.schedule.push({ label, dockIndex });
    return dockIndex;
  }

  dropsOnDock(dockIndex) {
    return this.schedule.filter((entry) => entry.dockIndex === dockIndex);
  }
}

module.exports = { CargoDrop };
