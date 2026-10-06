'use strict';

/**
 * Tracks lumber yard shift entries: board footage cut per shift.
 */
class ShiftLog {
  constructor() {
    this.entries = [];
  }

  /**
   * Logs a shift's board footage cut by a named crew.
   */
  logShift(crewName, boardFeet) {
    if (!Number.isFinite(boardFeet) || boardFeet < 0) {
      throw new RangeError('boardFeet must be a non-negative number');
    }
    this.entries.push({ crewName, boardFeet });
  }

  /**
   * Returns total board footage cut by a given crew.
   */
  totalFor(crewName) {
    return this.entries
      .filter((entry) => entry.crewName === crewName)
      .reduce((total, entry) => total + entry.boardFeet, 0);
  }

  /**
   * Returns the yard-wide total board footage across every shift.
   */
  yardTotal() {
    return this.entries.reduce((total, entry) => total + entry.boardFeet, 0);
  }
}

module.exports = { ShiftLog };

module.exports.ShiftLog = ShiftLog;
