'use strict';

class LegacyHttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function legacyNotFound(message) {
  return new LegacyHttpError(404, message || 'not found (legacy)');
}

function legacyBadRequest(message) {
  return new LegacyHttpError(400, message || 'bad request (legacy)');
}

function legacyForbidden(message) {
  return new LegacyHttpError(403, message || 'forbidden (legacy)');
}

module.exports = { LegacyHttpError, legacyNotFound, legacyBadRequest, legacyForbidden };
