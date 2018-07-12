const resolve = require('htte-resolve');
const query = require('htte-query');

const ContextError = require('./error');

function resolver(store, unit, segs = []) {
  let self = { segs: [] };
  self.exec = function(tagType, handler, literal) {
    if (tagType !== 'resolver') {
      self.log('differ plugin is forbidden in resolver context');
      return;
    }
    let value = self.resolve(self, literal);
    return handler(self, value);
  };
  self.enter = function(seg) {
    return resolver(store, unit, segs.concat(seg));
  };
  self.resolve = function(value) {
    return resolve(self, value);
  };
  self.query = query(store, unit);
  self.throw = function(msg) {
    throw new ContextError(msg, segs);
  };
  return self;
}

module.exports = resolver;
