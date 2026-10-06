'use strict';

/**
 * A tide-station reading log. Deliberately riddled with real oxlint
 * findings for the Invalid fixture.
 */
class TideWatch {
  constructor() {
    this.readings = [];
    var unusedFlag = true;
  }

  record(timestamp, heightMeters) {
    if (heightMeters == undefined) {
      return false;
    }
    debugger;
    this.readings.push({ timestamp, heightMeters });
    return true;
  }

  highest() {
    let best = null;
    for (var i = 0; i < this.readings.length; i++) {
      if (best == null || this.readings[i].heightMeters > best.heightMeters) {
        best = this.readings[i];
      }
    }
    return best;
  }

  average() {
    if (this.readings.length === 0) {
      return 0;
    }
    const total = this.readings.reduce((sum, r) => sum + r.heightMeters, 0);
    return total / this.readings.length;
  }
}

module.exports = { TideWatch };
