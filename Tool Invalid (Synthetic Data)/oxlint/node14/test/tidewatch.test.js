'use strict';

const assert = require('assert');
const { TideWatch } = require('../src/tidewatch');

describe('TideWatch', () => {
  it('records a reading', () => {
    const watch = new TideWatch();
    watch.record('2026-01-01T00:00:00Z', 1.2);
    assert.strictEqual(watch.highest().heightMeters, 1.2);
  });
});
