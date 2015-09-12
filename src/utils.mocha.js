import { mapPlugs, instanciatePlugs } from './utils';
import assert from 'assert';

describe('utils', () => {

  describe('instanciatePlugs()', () => {
    let Destination = require('./destination');

    class Dest1 extends Destination {
      get() { return 'dest1get: ' + this._res.test; }
    }
    class Dest2 extends Destination {
      get() { return 'dest2get: ' + this._res.test; }
    }

    it('should return instantiated destinations for the given res', () => {
      let destinationsClasses = new Map();

      destinationsClasses.set('dest1', Dest1);
      destinationsClasses.set('dest2', Dest2);
      let res = {
        test: 'Hola!',
      };

      let destinationsInstancesMap = instanciatePlugs(
        destinationsClasses,
        res
      );

      assert(destinationsInstancesMap.has('dest1'));
      assert.equal(destinationsInstancesMap.get('dest1').get(), 'dest1get: Hola!');
      assert(destinationsInstancesMap.has('dest2'));
      assert.equal(destinationsInstancesMap.get('dest2').get(), 'dest2get: Hola!');
    });

  });

  describe('mapPlugs()', () => {
    let plug1 = { test: 'plug1' };
    let plug2 = { test: 'plug2' };

    it('should return a new map of plugs', () => {
      let namesMapping = {
        plug1: '',
        plug2: 'plug2renamed',
      };
      let plugs = new Map();

      plugs.set('plug1', plug1);
      plugs.set('plug2', plug2);

      let newMap = mapPlugs(
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
