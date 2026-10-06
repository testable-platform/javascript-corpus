'use strict';

const assert = require('assert');
const { ShelfCount } = require('../src/shelfcount');

describe('ShelfCount', () => {
  it('adds quantity to a shelf and returns the new total', () => {
    const shelf = new ShelfCount();
    assert.strictEqual(shelf.addTo('A1', 10), 10);
  });
});
