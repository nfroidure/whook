import {getInvolvedPlugs, instanciatePlugs, mapPlugs} from './utils';
import sinon from 'sinon';
import assert from 'assert';

describe('utils', function() {

  describe('instanciatePlugs()', function() {
    var Destination =  require('./destination');

    class Dest1 extends Destination {
      get() { return 'dest1get: ' + this._res.test; }
    }
    class Dest2 extends Destination {
      get() { return 'dest2get: ' + this._res.test; }
    }

    it('should return instantiated destinations for the given res', function() {
      var destinationsClasses = new Map();
      destinationsClasses.set('dest1', Dest1);
      destinationsClasses.set('dest2', Dest2);
      var res = {
        test: 'Hola!'
      };

      var destinationsInstancesMap = instanciatePlugs(
        destinationsClasses,
        res
      );

      assert(destinationsInstancesMap.has('dest1'));
      assert.equal(destinationsInstancesMap.get('dest1').get(), 'dest1get: Hola!');
      assert(destinationsInstancesMap.has('dest2'));
      assert.equal(destinationsInstancesMap.get('dest2').get(), 'dest2get: Hola!');
    });

  });

  describe('mapPlugs()', function() {
    var plug1 = {test: 'plug1'};
    var plug2 = {test: 'plug2'};

    it('should return a new map of plugs', function() {
      var namesMapping = {
        plug1: '',
        plug2: 'plug2renamed'
      };
      var plugs = new Map();
      plugs.set('plug1', plug1);
      plugs.set('plug2', plug2);

      var newMap = mapPlugs(
        plugs,
        namesMapping
      );

      assert(newMap.plug1);
      assert.equal(newMap.plug1.test, 'plug1');
      assert(!newMap.plug2);
      assert(newMap.plug2renamed.test, 'plug2');
    });

  });

});
