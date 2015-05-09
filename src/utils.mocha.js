import {mapAndInstanciate} from './utils';
import sinon from 'sinon';
import assert from 'assert';

describe('utils', function() {

  describe('mapAndInstanciate()', function() {
    var Destination =  require('./destination');

    class Dest1 extends Destination {
      get() { return 'dest1get'; }
    }
    class Dest2 extends Destination {
      get() { return 'dest2get'; }
    }

    it('should return instantiated destinations for the given res', function() {
      var destinationsClasses = new Map();
      destinationsClasses.set('dest1', Dest1);
      destinationsClasses.set('dest2', Dest2);
      var destinationsMap = {
        dest1: '',
        dest2: 'dest2renamed'
      };
      var res = {};

      var dest2Stub = sinon.stub();


      var destinationsInstances = mapAndInstanciate(
        destinationsClasses,
        destinationsMap,
        res
      );

      assert(destinationsInstances.dest1);
      assert.equal(destinationsInstances.dest1.get(), 'dest1get');
      assert(!destinationsInstances.dest2);
      assert(destinationsInstances.dest2renamed);
      assert.equal(destinationsInstances.dest2renamed.get(), 'dest2get');
    });

  });

});
