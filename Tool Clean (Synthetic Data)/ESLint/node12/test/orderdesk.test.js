'use strict';

const assert = require('assert');
const { OrderDesk } = require('../src/orderdesk');

describe('OrderDesk', () => {
  it('accumulates a running total', () => {
    const desk = new OrderDesk();
    desk.addOrder('latte', 450);
    desk.addOrder('muffin', 325);
    assert.strictEqual(desk.runningTotal(), 775);
  });

  it('serves orders in first-in-first-out order', () => {
    const desk = new OrderDesk();
    desk.addOrder('tea', 300);
    desk.addOrder('scone', 275);
    const first = desk.takeNext();
    assert.strictEqual(first.name, 'tea');
  });

  it('returns null when the queue is empty', () => {
    const desk = new OrderDesk();
    assert.strictEqual(desk.takeNext(), null);
  });

  it('rejects a negative price', () => {
    const desk = new OrderDesk();
    assert.throws(() => desk.addOrder('cake', -1), RangeError);
  });
});
