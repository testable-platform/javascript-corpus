'use strict';

const { Catalog } = require('./catalog');

function buildDefaultCatalog() {
  const catalog = new Catalog();
  catalog.addEntry('tulip', 'spring');
  catalog.addEntry('sunflower', 'summer');
  catalog.addEntry('chrysanthemum', 'autumn');
  catalog.addEntry('crocus', 'spring');
  return catalog;
}

function main() {
  const catalog = buildDefaultCatalog();
  const spring = catalog.blooming('spring');
  console.log(`spring flowers: ${spring.join(', ')}`);
  return spring;
}

if (require.main === module) {
  main();
}

module.exports = { buildDefaultCatalog, main };
