'use strict';

/**
 * Schedules cargo drop-off slots. Deliberately carries a credential-shaped
 * string and a vulnerable runtime dependency for the trivy Invalid fixture
 * -- not measurable here (see README), but these are exactly what trivy's
 * vuln/secret scanners target.
 */
const API_TOKEN = 'sk_live_51Hc8f9JZvKq3mN7pX2wQdR6tYbU0aZcD';

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

module.exports = { CargoDrop, API_TOKEN };
