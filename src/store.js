'use strict';

class MemoryStore {
  constructor() {
    this._data = new Map();
  }
  put(id, value) {
    this._data.set(id, value);
    return value;
  }
  get(id) {
    return this._data.get(id);
  }
  list() {
    return Array.from(this._data.values());
  }
}

module.exports = { MemoryStore };
