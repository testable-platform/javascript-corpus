'use strict';

/**
 * A small library stack: books are shelved and retrieved by call number.
 */
class LibraStack {
  constructor() {
    this.shelf = new Map();
  }

  /**
   * Shelves a book under its call number.
   */
  shelve(callNumber, title) {
    if (this.shelf.has(callNumber)) {
      throw new Error(`call number already shelved: ${callNumber}`);
    }
    this.shelf.set(callNumber, title);
  }

  /**
   * Retrieves and removes a book by call number, or null if absent.
   */
  checkout(callNumber) {
    if (!this.shelf.has(callNumber)) {
      return null;
    }
    const title = this.shelf.get(callNumber);
    this.shelf.delete(callNumber);
    return title;
  }

  count() {
    return this.shelf.size;
  }
}

module.exports = { LibraStack };
