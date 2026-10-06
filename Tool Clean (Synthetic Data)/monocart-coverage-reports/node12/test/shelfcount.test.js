'use strict';

const assert = require('assert');
const { ShelfCount } = require('../src/shelfcount');

describe('ShelfCount', () => {
  it('adds quantity to a shelf', () => {
    const shelf = new ShelfCount();
    shelf.addTo('A1', 10);
    assert.strictEqual(shelf.countOn('A1'), 10);
  });

  it('accumulates across multiple additions', () => {
    const shelf = new ShelfCount();
    shelf.addTo('A1', 10);
    shelf.addTo('A1', 5);
    assert.strictEqual(shelf.countOn('A1'), 15);
  });

  it('returns zero for an untouched shelf', () => {
    const shelf = new ShelfCount();
    assert.strictEqual(shelf.countOn('B9'), 0);
  });

  it('computes the grand total across shelves', () => {
    const shelf = new ShelfCount();
    shelf.addTo('A1', 10);
    shelf.addTo('A2', 20);
    assert.strictEqual(shelf.grandTotal(), 30);
  });

  it('rejects a negative quantity', () => {
    const shelf = new ShelfCount();
    assert.throws(() => shelf.addTo('A1', -1), RangeError);
  });
});
