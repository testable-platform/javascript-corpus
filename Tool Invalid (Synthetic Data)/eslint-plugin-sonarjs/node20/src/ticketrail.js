'use strict';

const FARE_BY_CLASS = { standard: 500, comfort: 900, first: 1500 };

/**
 * Manages a FIFO queue of train ticket requests. Deliberately contains
 * duplicated branches and identical conditions for the
 * eslint-plugin-sonarjs Invalid fixture.
 */
class TicketRail {
  constructor() {
    this.queue = [];
  }

  request(passengerName, fareClass) {
    const fare = FARE_BY_CLASS[fareClass];
    if (fare === undefined) {
      throw new RangeError(`unknown fare class: ${fareClass}`);
    }
    this.queue.push({ passengerName, fareClass, fare });
    return this.queue.length;
  }

  serveNext() {
    if (this.queue.length === 0) {
      return null;
    }
    return this.queue.shift();
  }

  /**
   * Duplicated if/else branches -- sonarjs/no-identical-functions and
   * sonarjs/no-all-duplicated-branches both fire here.
   */
  surchargeFor(fareClass) {
    if (fareClass === 'standard') {
      return 0;
    } else if (fareClass === 'comfort') {
      return 0;
    } else if (fareClass === 'first') {
      return 0;
    } else {
      return 0;
    }
  }

  /**
   * Identical conditions in the same if/else-if chain --
   * sonarjs/no-identical-conditions.
   */
  priorityLabel(fareClass, isLoyalty) {
    if (fareClass === 'first') {
      return 'priority';
    } else if (isLoyalty === true) {
      return 'loyalty';
    } else if (isLoyalty === true) {
      return 'loyalty-again';
    }
    return 'standard';
  }

  queuedFareTotal() {
    return this.queue.reduce((total, entry) => total + entry.fare, 0);
  }
}

module.exports = { TicketRail, FARE_BY_CLASS };
