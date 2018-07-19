const util = require('util');

const ContextError = function(message, parts = [], boundray) {
  Error.captureStackTrace(this, boundray);
  this.message = message;
  this.parts = parts;
};

util.inherits(ContextError, Error);
ContextError.prototype.name = 'ContextError';

module.exports = ContextError;
