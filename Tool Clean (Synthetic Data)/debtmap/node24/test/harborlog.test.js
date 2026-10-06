'use strict';

const assert = require('assert');
const { HarborLog } = require('../src/harborlog');

describe('HarborLog', () => {
  it('assigns a vessel to a berth', () => {
    const log = new HarborLog();
    log.arrive('Meridian', 3);
    assert.strictEqual(log.occupiedBerths(), 1);
  });

  it('frees a berth on departure', () => {
    const log = new HarborLog();
    log.arrive('Meridian', 3);
    assert.strictEqual(log.depart(3), 'Meridian');
    assert.strictEqual(log.occupiedBerths(), 0);
  });

  it('returns null departing an empty berth', () => {
    const log = new HarborLog();
    assert.strictEqual(log.depart(9), null);
  });

  it('rejects double-booking a berth', () => {
    const log = new HarborLog();
    log.arrive('Meridian', 3);
    assert.throws(() => log.arrive('Coral Star', 3), Error);
  });
});
