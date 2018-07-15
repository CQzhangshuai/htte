const os = require('os');

module.exports = function(options) {
  return {
    name: 'or',
    kind: 'sequence',
    diff: function(context, literal, actual) {
      if (!Array.isArray(literal)) return;
      let errors = [];
      for (let item of literal) {
        try {
          context.diff(item, actual);
          return;
        } catch (err) {
          errors.push(err.segs.join('.') + ': ' + err.message);
        }
      }
      context.throw(errors.join(os.EOL));
    }
  };
};
