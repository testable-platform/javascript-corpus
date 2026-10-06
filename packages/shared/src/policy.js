'use strict';

const { isProductId } = require('./ids');

function evaluatePolicy(record, role) {
  if (!record || !isProductId(record.id)) {
    return { allowed: false, reason: 'invalid-id' };
  }
  if (role === 'viewer') {
    return { allowed: record.status === 'published', reason: 'viewer-read-only' };
  }
  if (role === 'editor') {
    if (record.status === 'archived') {
      return { allowed: false, reason: 'archived-locked' };
    }
    return { allowed: true, reason: 'editor-ok' };
  }
  if (role === 'owner') {
    return { allowed: true, reason: 'owner-ok' };
  }
  return { allowed: false, reason: 'unknown-role' };
}

function canTransition(from, to) {
  const graph = {
    draft: ['published', 'archived'],
    published: ['archived'],
    archived: [],
  };
  switch (from) {
    case 'draft':
    case 'published':
    case 'archived':
      return (graph[from] || []).includes(to);
    default:
      return false;
  }
}

module.exports = { evaluatePolicy, canTransition };
