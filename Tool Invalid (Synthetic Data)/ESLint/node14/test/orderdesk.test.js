'use strict';

const assert = require('assert');
const { OrderDesk } = require('../src/orderdesk');

describe('OrderDesk', () => {
  it('adds an order', () => {
    const desk = new OrderDesk();
    desk.addOrder('latte', 450);
    assert.strictEqual(desk.total(), 450);
  });
});
