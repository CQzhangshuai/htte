module.exports = function(options) {
  return {
    name: 'rangetime',
    kind: 'sequence',
    diff: function(context, literal, actual) {
      if (literal === null) context.throw('literal cannot be null');
      let [min, max, ref = new Date()] = literal;
      if (Number.isNaN(min) || Number.isNaN(max)) {
        context.throw('literal value [min,max,_] must be number');
      }
      try {
        ref = parseDate(ref);
      } catch (err) {
        context.throw('literval value [_,_,ref] must be date object or string');
      }

      try {
        actual = parseDate(actual);
      } catch (err) {
        context.throw('actual must be date object or string');
      }

      let value = (actual.getTime() - ref.getTime()) / 1000;
      if (value >= min && value < max) return;
      context.throw('time do not match range');
    }
  };
};

function parseDate(value) {
  if (value instanceof Date) {
    return value;
  }
  let date = new Date(value);
  if (date.toString() === 'Invalid Date') {
    throw new Error();
  }
  return date;
}
