'use strict';

const assert = require('assert');
const { Chronicle } = require('../src/chronicle');

describe('Chronicle', () => {
  it('adds and counts entries', () => {
    const log = new Chronicle();
    log.addEntry('2026-01-01', 'New year entry');
    assert.strictEqual(log.entryCount(), 1);
  });
});
