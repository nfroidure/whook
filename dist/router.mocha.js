'use strict';

() => _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

describe('Router', () => () {
  var Router = require('./router')['default'];
  var WHOOK_SYMBOL = require('./router')['WHOOK_SYMBOL'];

  describe('constructor()', () => () {
    it('should work', () => () {
      new Router();
    });
  });

  describe('service()', () => () {

    it('should register a new service', () => () {
      var testService = { test: 'test' };
      var router = new Router();
      router.service('test', testService);

      _assert2['default'].equal(router.services.get('test'), testService);
    });
  });

  describe('source()', () => () {

    it('should register a new source', () => () {
      var testSource = { test: 'test' };
      var router = new Router();
      router.source('test', testSource);

      _assert2['default'].equal(router.sources.get('test'), testSource);
    });
  });

  describe('destination()', () => () {

    it('should register a new destination', () => () {
      var testDestination = { test: 'test' };
      var router = new Router();
      router.destination('test', testDestination);

      _assert2['default'].equal(router.destinations.get('test'), testDestination);
    });
  });

  describe('add()', () => () {

    it('should build a list of whookMounts', () => () {

      var router = new Router().add({
        nodes: []
      }, {
        name: 'Whook #1'
      }).add({
        nodes: ['plop']
      }, {
        name: 'Whook #2'
      }).add({
        nodes: ['plop', 'test']
      }, {
        name: 'Whook #3'
      }).add({
        nodes: ['plop']
      }, {
        name: 'Whook #4'
      });

      _assert2['default'].deepEqual(router._whookMounts, [{
        specs: { nodes: [] },
        whook: { name: 'Whook #1' }
      }, {
        specs: { nodes: ['plop'] },
        whook: { name: 'Whook #2' }
      }, {
        specs: { nodes: ['plop', 'test'] },
        whook: { name: 'Whook #3' }
      }, {
        specs: { nodes: ['plop'] },
        whook: { name: 'Whook #4' }
      }]);
    });
  });

  describe('_runWhook()', () => () {

    it('should work', () => (done) {
      var logs = [];
      var router = new Router();
      router._runWhook({
        pre: () => pre($) {
          $.services.log('sync');
        }
      }, 'pre', {
        services: {
          log: () => log(content) {
            logs.push(content);
          }
        }
      }).then(() => () {
        _assert2['default'].deepEqual(logs, ['sync']);
        done();
      })['catch'](done);
    });
  });

  describe('_runNextWhookMount()', () => () {

    it('should work', () => (done) {
      var logs = [];
      var router = new Router();
      router.add({
        nodes: []
      }, {
        name: 'syncwhook',
        pre: () => pre($) {
          $.services.log('syncwhook');
        }
      });
      router.add({
        nodes: []
      }, {
        name: 'asyncwhook',
        pre: () => pre($, next) {
          $.services.log('asyncwhook');
          setImmediate(() => () {
            next();
          });
        }
      });
      var services = {
        log: () => log(content) {
          logs.push(content);
        }
      };
      router._runNextWhookMount(router._whookMounts, 'pre', 0, [{
        services: services
      }, {
        services: services
      }]).then(() => () {
        _assert2['default'].deepEqual(logs, ['syncwhook', 'asyncwhook']);
        done();
      })['catch'](done);
    });
  });

  describe('_prepareWhooksChain()', () => () {

    it('should return involved hooks', () => () {
      var router = new Router();
      var whookMounts = [{
        specs: { nodes: [] },
        whook: { name: 'Whook #1' }
      }, {
        specs: { nodes: ['plop'] },
        whook: { name: 'Whook #2' }
      }, {
        specs: { nodes: ['plop', 'test'] },
        whook: { name: 'Whook #3' }
      }, {
        specs: { nodes: ['plop'] },
        whook: { name: 'Whook #4' }
      }, {
        specs: { nodes: ['plop', /^[a-f0-9]{24}$/] },
        whook: { name: 'Whook #5' }
      }, {
        specs: { nodes: ['plop', /^[a-f0-9]{24}$/, 'kikoolol'] },
        whook: { name: 'Whook #6' }
      }, {
        specs: { nodes: ['plop', /^[0-9]+$/, 'kikoolol'] },
        whook: { name: 'Whook #6' }
      }];
      whookMounts.forEach(() => (whookMount) {
        router.add(whookMount.specs, whookMount.whook);
      });
      _assert2['default'].deepEqual(router._prepareWhooksChain({ url: '/' }), [whookMounts[0]]);
      _assert2['default'].deepEqual(router._prepareWhooksChain({ url: '/plop' }), [whookMounts[0], whookMounts[1], whookMounts[3]]);
      _assert2['default'].deepEqual(router._prepareWhooksChain({ url: '/plop/test' }), [whookMounts[0], whookMounts[1], whookMounts[2], whookMounts[3]]);
      (0, _neatequal2['default'])(router._prepareWhooksChain({ url: '/plop/abbacacaabbacacaabbacaca/kikoolol' }), [whookMounts[0], whookMounts[1], whookMounts[3], whookMounts[4], whookMounts[5]]);
    });
  });
});