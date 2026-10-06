'use strict';

const { createService } = require('./service');
const { MemoryStore } = require('./store');

function createApp() {
  const store = new MemoryStore();
  const service = createService(store);
  return {
    product: 'GraniteMill',
    domain: 'Community garden plots',
    service,
  };
}

module.exports = { createApp };
