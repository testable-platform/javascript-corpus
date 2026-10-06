'use strict';

const assert = require('assert');
const { TicketRail } = require('../src/ticketrail');

describe('TicketRail', () => {
  it('serves passengers in order', () => {
    const rail = new TicketRail();
    rail.request('Amara', 'standard');
    rail.request('Beno', 'first');
    const first = rail.serveNext();
    assert.strictEqual(first.passengerName, 'Amara');
  });

  it('totals the queued fare', () => {
    const rail = new TicketRail();
    rail.request('Cass', 'standard');
    rail.request('Deja', 'comfort');
    assert.strictEqual(rail.queuedFareTotal(), 1400);
  });

  it('returns null when the queue is empty', () => {
    const rail = new TicketRail();
    assert.strictEqual(rail.serveNext(), null);
  });

  it('rejects an unknown fare class', () => {
    const rail = new TicketRail();
    assert.throws(() => rail.request('Eshe', 'luxury'), RangeError);
  });
});
