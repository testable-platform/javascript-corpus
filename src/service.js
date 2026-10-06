'use strict';

const { evaluatePolicy, canTransition } = require('./policy');
const { ok, err } = require('./result');
const { toProductId } = require('./ids');

function createService(store) {
  let seq = 0;

  function upsert(fields, role) {
    const id = fields.id || toProductId(seq++);
    const record = Object.assign({ id, status: 'draft' }, fields, { id });
    const decision = evaluatePolicy(record, role);
    if (!decision.allowed) return err(decision.reason);
    store.put(id, record);
    return ok(record);
  }

  function move(id, toStatus, role) {
    const record = store.get(id);
    if (!record) return err('not-found');
    const decision = evaluatePolicy(record, role);
    if (!decision.allowed) return err(decision.reason);
    if (!canTransition(record.status, toStatus)) return err('invalid-transition');
    const next = Object.assign({}, record, { status: toStatus });
    store.put(id, next);
    return ok(next);
  }

  function all() {
    return store.list();
  }

  return { upsert, move, all };
}

module.exports = { createService };
