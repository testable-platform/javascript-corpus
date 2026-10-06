'use strict';

function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '').trim().slice(0, 240);
}

function allowRole(role) {
  return role === 'owner' || role === 'editor' || role === 'viewer';
}

module.exports = { sanitizeText, allowRole };
