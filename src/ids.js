'use strict';

const PREFIX = 'GM-';

function isProductId(value) {
  return typeof value === 'string' && value.startsWith(PREFIX) && value.length > PREFIX.length;
}

function toProductId(seq) {
  const n = Number(seq);
  if (!Number.isInteger(n) || n < 0) {
    throw new TypeError('toProductId requires a non-negative integer sequence');
  }
  return PREFIX + String(n).padStart(4, '0');
}

module.exports = { PREFIX, isProductId, toProductId };
