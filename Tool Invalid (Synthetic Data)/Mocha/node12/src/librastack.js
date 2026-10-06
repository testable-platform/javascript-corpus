'use strict';

/**
 * A library call-number shelving system. Deliberately buggy for the Mocha
 * Invalid fixture -- most behaviors are wrong relative to the tests below.
 */
class LibraStack {
  constructor() {
    this.shelf = new Map();
  }

  shelve(callNumber, title) {
    // Bug: silently overwrites instead of rejecting a duplicate call number.
    this.shelf.set(callNumber, title);
    return true;
  }

  find(callNumber) {
    // Bug: returns undefined instead of null for a missing entry.
    return this.shelf.get(callNumber);
  }

  count() {
    // Bug: off-by-one.
    return this.shelf.size + 1;
  }

  remove(callNumber) {
    // Bug: never actually deletes.
    return this.shelf.has(callNumber);
  }
}

module.exports = { LibraStack };
