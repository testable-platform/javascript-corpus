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
});
