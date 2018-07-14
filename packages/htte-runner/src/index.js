const EventEmitter = require('events');
const _ = require('lodash');
const context = require('htte-context');
const CURSOR_KEY = 'metadata.cursor';

function run(options) {
  let { session, clients, reporters, units, controls } = options;
  let emitter = new EventEmitter();
  Object.keys(reporters).forEach(function(name) {
    let reporter = reporters[name];
    reporter(emitter);
  });
  let hrstart = process.hrtime();
  emitter.emit('start', { units });
  let cursor = 0;
  if (controls.continue) {
    session.load();
    let startAt = session.get(CURSOR_KEY);
    if (startAt) cursor = startAt;
  }
  let stopAt = stopUnitAt(units, cursor);
  let tasks = units.slice(cursor, stopAt).map(function(unit, index) {
    return runUnit(unit);
  });
  let stop = false;
  return tasks
    .reduce(function(promise, task) {
      return promise.then(function() {
        if (stop) return Promise.resolve();
        return task(session, clients, emitter)
          .then(function() {
            session.set(CURSOR_KEY, ++cursor);
            emitter.emit('doneUnit');
          })
          .catch(function(err) {
            emitter.emit('errorUnit', err);
            if (controls.bail) stop = true;
          });
      });
    }, Promise.resolve())
    .then(function() {
      session.save();
      let [s, n] = process.hrtime(hrstart);
      let duration = s * 1000 + Math.round(n / 1000000);
      emitter.emit('done', { units, duration });
    });
}

function runUnit(unit) {
  unit.session = {};
  return function(session, clients, emitter) {
    return new Promise(function(resolve, reject) {
      if (unit.ctx.firstChild) {
        emitter.emit('enterGroup', { unit });
      }
      if (unit.metadata.skip) {
        emitter.emit('skipUnit', { unit });
        unit.session.state = 'skip';
        return resolve();
      }
      emitter.emit('runUnit', { unit });
      let client;
      if (_.isUndefined(unit.client)) {
        client = clients[Object.keys(clients)[0]];
      } else {
        client = clients[unit.client];
      }
      if (!client) return reject(`client ${unit.client} is unsupported`);
      let resolver = context.resolver(session.get('data'), unit);
      let req;
      try {
        req = resolver.resolve(unit.req);
      } catch (err) {
        reject(err);
      }
      unit.session.req = req;
      session.set(['data', unit.ctx.module, unit.name, 'req'].join('.'), req);
      let hrstart = process.hrtime();
      client
        .run(req, unit.res)
        .then(function(res) {
          let [s, n] = process.hrtime(hrstart);
          unit.session.duration = s * 1000 + Math.round(n / 1000000);
          unit.session.res = res;
          session.set(['data', unit.ctx.module, unit.name, 'res'].join('.'), res);
          if (unit.res) {
            let differ = context.differ(session.get('data'), unit);
            try {
              Object.keys(unit.res).forEach(function(key) {
                differ.enter(key).diff(unit.res[key], res[key], true);
              });
            } catch (err) {
              reject(err);
            }
          }
          unit.session.state = 'pass';
          resolve();
        })
        .catch(reject);
    }).catch(function(err) {
      unit.session.state = 'fail';
      unit.session.err = err;
      return Promise.reject(err);
    });
  };
}

function stopUnitAt(units, cursor) {
  let i = cursor;
  for (; i < units.length; i++) {
    let unit = units[i];
    if (unit.metadata.stop) break;
  }
  return i + 1;
}

exports.run = run;
