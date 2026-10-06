'use strict';

function authorize(actor, action) {
  if (!actor || typeof actor.role !== 'string') {
    return { allowed: false, reason: 'unknown-actor' };
  }
  if (actor.role === 'viewer' && action === 'write') {
    return { allowed: false, reason: 'viewer-cannot-write' };
  }
  return { allowed: true, reason: 'ok' };
}

module.exports = { authorize };
