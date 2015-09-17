'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _neatequal = require('neatequal');

var _neatequal2 = _interopRequireDefault(_neatequal);

var _router = require('./router');

var _router2 = _interopRequireDefault(_router);

describe('Router', function () {

  describe('constructor()', function () {
    it('should work', function () {
      new _router2['default']();
    });
  });

  describe('service()', function () {

    it('should register a new service', function () {
      var testService = { test: 'test' };
      var router = new _router2['default']();

      router.service('test', testService);

      _assert2['default'].equal(router.services.get('test'), testService);
    });
  });

  describe('source()', function () {

    it('should register a new source', function () {
      var testSource = { test: 'test' };
      var router = new _router2['default']();

      router.source('test', testSource);

      _assert2['default'].equal(router.sources.get('test'), testSource);
    });
  });

  describe('destination()', function () {

    it('should register a new destination', function () {
      var testDestination = { test: 'test' };
      var router = new _router2['default']();

      router.destination('test', testDestination);

      _assert2['default'].equal(router.destinations.get('test'), testDestination);
    });
  });

  describe('add()', function () {

    it('should build a list of whookMounts', function () {
      var whooksMounts = [{
        specs: {
          nodes: []
        },
        whook: {
          name: 'Whook #1',
          init: function init() {}
        }
      }, {
        specs: {
          nodes: ['plop']
        },
        whook: {
          name: 'Whook #2',
          init: function init() {}
        }
      }, {
        specs: {
          nodes: ['plop', 'test']
        },
        whook: {
          name: 'Whook #3',
          init: function init() {}
        }
      }, {
        specs: {
          nodes: ['plop']
        },
        whook: {
          name: 'Whook #4',
          init: function init() {}
        }
      }];
      var router = new _router2['default']().add(whooksMounts[0].specs, whooksMounts[0].whook).add(whooksMounts[1].specs, whooksMounts[1].whook).add(whooksMounts[2].specs, whooksMounts[2].whook).add(whooksMounts[3].specs, whooksMounts[3].whook);

      _assert2['default'].deepEqual(router._whookMounts, whooksMounts);
    });
  });

  describe('_runWhook()', function () {

    it('should work', function (done) {
      var logs = [];
      var router = new _router2['default']();

      router._runWhook({
        pre: function pre($) {
          $.services.log('sync');
        }
      }, 'pre', {
        services: {
          log: function log(content) {
            logs.push(content);
          }
        }
      }).then(function () {
        _assert2['default'].deepEqual(logs, ['sync']);
        done();
      })['catch'](done);
    });
  });

  describe('_runNextWhookMount()', function () {

    it('should work', function (done) {
      var logs = [];
      var router = new _router2['default']();
      var services = {
        log: function log(content) {
          logs.push(content);
        }
      };

      router.add({
        nodes: []
      }, {
        name: 'syncwhook',
        init: function init() {},
        pre: function pre($) {
          $.services.log('syncwhook');
        }
      });
      router.add({
        nodes: []
      }, {
        name: 'asyncwhook',
        init: function init() {},
        pre: function pre($, next) {
          $.services.log('asyncwhook');
          setImmediate(function () {
            next();
          });
        }
      });
      router._runNextWhookMount(router._whookMounts, 'pre', 0, [{
        services: services
      }, {
        services: services
      }]).then(function () {
        _assert2['default'].deepEqual(logs, ['syncwhook', 'asyncwhook']);
        done();
      })['catch'](done);
    });
  });

  describe('_getInvolvedWhooksMount()', function () {

    it('should return involved hooks', function () {
      var router = new _router2['default']();
      var whookMounts = [{
        specs: { nodes: [] },
        whook: {
          name: 'Whook #1',
          init: function init() {}
        }
      }, {
        specs: { nodes: ['plop'] },
        whook: {
          name: 'Whook #2',
          init: function init() {}
        }
      }, {
        specs: { nodes: ['plop', 'test'] },
        whook: {
          name: 'Whook #3',
          init: function init() {}
        }
      }, {
        specs: { nodes: ['plop'] },
        whook: {
          name: 'Whook #4',
          init: function init() {}
        }
      }, {
        specs: { nodes: ['plop', /^[a-f0-9]{24}$/] },
        whook: {
          name: 'Whook #5',
          init: function init() {}
        }
      }, {
        specs: { nodes: ['plop', /^[a-f0-9]{24}$/, 'kikoolol'] },
        whook: {
          name: 'Whook #6',
          init: function init() {}
        }
      }, {
        specs: { nodes: ['plop', /^[0-9]+$/, 'kikoolol'] },
        whook: {
          name: 'Whook #6',
          init: function init() {}
        }
      }];

      whookMounts.forEach(function (whookMount) {
        router.add(whookMount.specs, whookMount.whook);
      });
      _assert2['default'].deepEqual(router._getInvolvedWhooksMount({ url: '/' }), [whookMounts[0]]);
      _assert2['default'].deepEqual(router._getInvolvedWhooksMount({ url: '/plop' }), [whookMounts[0], whookMounts[1], whookMounts[3]]);
      _assert2['default'].deepEqual(router._getInvolvedWhooksMount({ url: '/plop/test' }), [whookMounts[0], whookMounts[1], whookMounts[2], whookMounts[3]]);
      (0, _neatequal2['default'])(router._getInvolvedWhooksMount({ url: '/plop/abbacacaabbacacaabbacaca/kikoolol' }), [whookMounts[0], whookMounts[1], whookMounts[3], whookMounts[4], whookMounts[5]]);
    });
  });
});