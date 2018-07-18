module.exports = function(options) {
  return {
    name: 'type',
    kind: 'scalar',
    diff: function(context, literal, actual) {
      if (typeof literal !== 'string' && literal !== null) context.throw('literal value must be string or null');
      if (actual === undefined) context.throw('actual value do not exist');
      if (literal === '' || literal === null) return;
      if (actual === null && literal === 'null') return;
      if (Array.isArray(actual) & (literal === 'array')) return;
      if (typeof actual !== literal) context.throw(`actual value is not ${literal}`);
    }
  };
};
