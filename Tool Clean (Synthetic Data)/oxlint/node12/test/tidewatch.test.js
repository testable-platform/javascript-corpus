'use strict';

const assert = require('assert');
const { TideWatch } = require('../src/tidewatch');

describe('TideWatch', () => {
  it('tracks the highest reading', () => {
    const watch = new TideWatch('Harbor Point');
    watch.record(120);
    watch.record(340);
    watch.record(200);
    assert.strictEqual(watch.highWater(), 340);
  });

  it('returns null high water with no readings', () => {
    const watch = new TideWatch('Cove');
    assert.strictEqual(watch.highWater(), null);
  });

  it('computes the average reading', () => {
    const watch = new TideWatch('Reef');
    watch.record(100);
    watch.record(200);
    assert.strictEqual(watch.average(), 150);
  });

  it('rejects a non-finite reading', () => {
    const watch = new TideWatch('Bay');
    assert.throws(() => watch.record(NaN), TypeError);
  });
});
