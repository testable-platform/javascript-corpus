'use strict';

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFound(message) {
  return new HttpError(404, message || 'not found');
}

function badRequest(message) {
  return new HttpError(400, message || 'bad request');
}

function forbidden(message) {
  return new HttpError(403, message || 'forbidden');
}

module.exports = { HttpError, notFound, badRequest, forbidden };
