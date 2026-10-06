'use strict';

const FARE_BY_CLASS = { standard: 500, comfort: 900, first: 1500 };

/**
 * Manages a first-in-first-out queue of train ticket requests.
 */
class TicketRail {
  constructor() {
    this.queue = [];
  }

  /**
   * Adds a passenger request for a given fare class.
   */
  request(passengerName, fareClass) {
    const fare = FARE_BY_CLASS[fareClass];
    if (fare === undefined) {
      throw new RangeError(`unknown fare class: ${fareClass}`);
    }
    this.queue.push({ passengerName, fareClass, fare });
    return this.queue.length;
  }

  /**
   * Serves the next passenger in line, or returns null when empty.
   */
  serveNext() {
    if (this.queue.length === 0) {
      return null;
    }
    return this.queue.shift();
  }

  /**
   * Returns the total fare currently queued, in cents.
   */
  queuedFareTotal() {
    return this.queue.reduce((total, entry) => total + entry.fare, 0);
  }
}

module.exports = { TicketRail, FARE_BY_CLASS };
