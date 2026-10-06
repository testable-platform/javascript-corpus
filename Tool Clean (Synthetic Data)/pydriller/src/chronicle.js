'use strict';

/**
 * A small append-only diary of dated entries.
 */
class Chronicle {
  constructor() {
    this.entries = [];
  }

  addEntry(date, text) {
    this.entries.push({ date, text });
  }

  entryCount() {
    return this.entries.length;
  }

  entriesOn(date) {
    return this.entries.filter((entry) => entry.date === date);
  }
}

module.exports = { Chronicle };

module.exports.Chronicle = Chronicle;
