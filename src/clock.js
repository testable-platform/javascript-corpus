'use strict';

class FixedClock {
  constructor(date) {
    this._date = date;
  }
  now() {
    return new Date(this._date.getTime());
  }
}

const DATASET_CLOCK = new FixedClock(new Date('2026-03-15T12:00:00.000Z'));

module.exports = { FixedClock, DATASET_CLOCK };
