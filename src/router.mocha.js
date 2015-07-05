import assert from 'assert';
import neatequal from 'neatequal';

describe('Router', function() {
  var Router = require('./router')['default'];
  var WHOOK_SYMBOL = require('./router')['WHOOK_SYMBOL'];


  describe('constructor()', function() {
    it('should work', function() {
      new Router();
    });
  });

  describe('service()', function() {

    it('should register a new service', function() {
      var testService = {test: 'test'};
      var router = new Router();
      router.service('test', testService);

      assert.equal(router.services.get('test'), testService);
    });

  });

  describe('source()', function() {

    it('should register a new source', function() {
      var testSource = {test: 'test'};
      var router = new Router();
      router.source('test', testSource);

      assert.equal(router.sources.get('test'), testSource);
    });

  });

  describe('destination()', function() {

    it('should register a new destination', function() {
      var testDestination = {test: 'test'};
      var router = new Router();
      router.destination('test', testDestination);

      assert.equal(router.destinations.get('test'), testDestination);
    });

  });

  describe('add()', function() {

    it('should build a list of whookMounts', function() {

      var router = new Router()
        .add({
          nodes: []
        }, {
          name: 'Whook #1'
        })
        .add({
          nodes: ['plop']
        }, {
          name: 'Whook #2'
        })
        .add({
          nodes: ['plop', 'test']
        }, {
          name: 'Whook #3'
        })
        .add({
          nodes: ['plop']
        }, {
          name: 'Whook #4'
        });


      assert.deepEqual(router._whookMounts, [{
        specs: { nodes: [] },
        whook: { name: 'Whook #1' }
      }, {
        specs: { nodes: ['plop'] },
        whook: { name: 'Whook #2' }
      }, {
        specs: { nodes: ['plop', 'test'] },
        whook: { name: 'Whook #3' },
      }, {
        specs: { nodes: ['plop'] },
        whook: { name: 'Whook #4' }
      }]);
    });

  });

  describe('_runWhook()', function() {

    it('should work', function(done) {
      var logs = [];
      var router = new Router();
      router._runWhook({
        pre: ($) => {
          $.services.log('sync');
        }
      }, 'pre', {
        services: {
          log: (content) => {
            logs.push(content);
          }
        }
      }).then(() => {
        assert.deepEqual(logs, ['sync']);
        done();
      }).catch(done);
    });

  });

  describe('_runNextWhookMount()', function() {

    it('should work', function(done) {
      var logs = [];
      var router = new Router();
      router.add({
        nodes: []
      }, {
        name: 'syncwhook',
        pre: function($) {
          $.services.log('syncwhook');
        }
      });
      router.add({
        nodes: []
      }, {
        name: 'asyncwhook',
        pre: function($, next) {
          $.services.log('asyncwhook');
          setImmediate(function() {
            next();
          });
        }
      });
      var services = {
        log: (content) => { logs.push(content); }
      };
      router._runNextWhookMount(router._whookMounts, 'pre', 0, [{
        services
      }, {
        services
      }]).then(() => {
          assert.deepEqual(logs, ['syncwhook', 'asyncwhook']);
          done();
        }).catch(done);
    });

  });

  describe('_prepareWhooksChain()', function() {

    it('should return involved hooks', function() {
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
      whookMounts.forEach(function(whookMount) {
        router.add(whookMount.specs, whookMount.whook);
      });
      assert.deepEqual(
        router._prepareWhooksChain({url: '/'}), [
          whookMounts[0]
        ]
      );
      assert.deepEqual(
        router._prepareWhooksChain({url: '/plop'}), [
          whookMounts[0],
          whookMounts[1],
          whookMounts[3]
        ]
      );
      assert.deepEqual(
        router._prepareWhooksChain({url: '/plop/test'}), [
          whookMounts[0],
          whookMounts[1],
          whookMounts[2],
          whookMounts[3]
        ]
      );
      neatequal(
        router._prepareWhooksChain({url: '/plop/abbacacaabbacacaabbacaca/kikoolol'}), [
          whookMounts[0],
          whookMounts[1],
          whookMounts[3],
          whookMounts[4],
          whookMounts[5]
        ]
      );
    });

  });

});
