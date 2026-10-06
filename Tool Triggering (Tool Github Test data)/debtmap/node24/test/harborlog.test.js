'use strict';

const assert = require('assert');
const { HarborLog } = require('../src/harborlog');

describe('HarborLog', () => {
  it('tracks occupied berths', () => {
    const log = new HarborLog();
    log.arrive('Meridian', 1, 'cargo', 'low', false, true);
    assert.strictEqual(log.occupiedBerths(), 1);
  });
});
