'use strict';

function ok(value) {
  return { ok: true, value };
}

function err(message) {
  return { ok: false, error: message };
}

function mapResult(result, fn) {
  if (!result.ok) return result;
  return ok(fn(result.value));
}

module.exports = { ok, err, mapResult };
