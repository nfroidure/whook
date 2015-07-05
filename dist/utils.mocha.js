'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _utils = require('./utils');

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

describe('utils', function () {

  describe('getInvolvedPlugs()', function () {

    it('should return plugs for the given whookMounts', function () {
      destinationsClasses.set('header', { test: 'header' });
      destinationsClasses.set('status', { test: 'status' });
      destinationsClasses.set('what', { test: 'what' });
      destinationsClasses.set('else', { test: 'else' });

      var destinationsInstancesMap = (0, _utils.getInvolvedPlugs)(destinationsClasses, [{
        specs: {
          out: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            title: 'Output',
            type: 'object',
            properties: {
              contentDisposition: {
                destination: 'headers:Content-Disposition',
                type: 'string'
              }
            }
          }
        }
      }, {
        specs: {
          out: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            title: 'Output',
            type: 'object',
            properties: {
              contentDisposition: {
                destination: 'status',
                type: 'number'
              }
            }
          }
        }
      }]);

      (0, _assert2['default'])(destinationsInstancesMap.has('dest1'));
      _assert2['default'].equal(destinationsInstancesMap.get('dest1').get(), 'dest1get: Hola!');
      (0, _assert2['default'])(destinationsInstancesMap.has('dest2'));
      _assert2['default'].equal(destinationsInstancesMap.get('dest2').get(), 'dest2get: Hola!');
    });
  });

  describe('instanciatePlugs()', function () {
    var Destination = require('./destination');

    var Dest1 = (function (_Destination) {
      function Dest1() {
        _classCallCheck(this, Dest1);

        _get(Object.getPrototypeOf(Dest1.prototype), 'constructor', this).apply(this, arguments);
      }

      _inherits(Dest1, _Destination);

      _createClass(Dest1, [{
        key: 'get',
        value: function get() {
          return 'dest1get: ' + this._res.test;
        }
      }]);

      return Dest1;
    })(Destination);

    var Dest2 = (function (_Destination2) {
      function Dest2() {
        _classCallCheck(this, Dest2);

        _get(Object.getPrototypeOf(Dest2.prototype), 'constructor', this).apply(this, arguments);
      }

      _inherits(Dest2, _Destination2);

      _createClass(Dest2, [{
        key: 'get',
        value: function get() {
          return 'dest2get: ' + this._res.test;
        }
      }]);

      return Dest2;
    })(Destination);

    it('should return instantiated destinations for the given res', function () {
      var destinationsClasses = new Map();
      destinationsClasses.set('dest1', Dest1);
      destinationsClasses.set('dest2', Dest2);
      var res = {
        test: 'Hola!'
      };

      var destinationsInstancesMap = (0, _utils.instanciatePlugs)(destinationsClasses, res);

      (0, _assert2['default'])(destinationsInstancesMap.has('dest1'));
      _assert2['default'].equal(destinationsInstancesMap.get('dest1').get(), 'dest1get: Hola!');
      (0, _assert2['default'])(destinationsInstancesMap.has('dest2'));
      _assert2['default'].equal(destinationsInstancesMap.get('dest2').get(), 'dest2get: Hola!');
    });
  });

  describe('mapPlugs()', function () {
    var plug1 = { test: 'plug1' };
    var plug2 = { test: 'plug2' };

    it('should return a new map of plugs', function () {
      var namesMapping = {
        plug1: '',
        plug2: 'plug2renamed'
      };
      var plugs = new Map();
      plugs.set('plug1', plug1);
      plugs.set('plug2', plug2);

      var newMap = (0, _utils.mapPlugs)(plugs, namesMapping);

      (0, _assert2['default'])(newMap.plug1);
      _assert2['default'].equal(newMap.plug1.test, 'plug1');
      (0, _assert2['default'])(!newMap.plug2);
      (0, _assert2['default'])(newMap.plug2renamed.test, 'plug2');
    });
  });
});