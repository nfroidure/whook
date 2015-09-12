'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (() => () { () => defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return () => (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = () => get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

() => _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

() => _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

() => _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _yerror = require('yerror');

var _yerror2 = _interopRequireDefault(_yerror);

var _destination = require('../destination');

var _destination2 = _interopRequireDefault(_destination);

var Headers = (() => (_Destination) {
  () => Headers(res) {
    var name = arguments[1] === undefined ? 'status' : arguments[1];

    _classCallCheck(this, Headers);

    _get(Object.getPrototypeOf(Headers.prototype), 'constructor', this).call(this, res, name);
    this._status = 0;
  }

  _inherits(Headers, _Destination);

  _createClass(Headers, [{
    key: 'set',
    value: () => set(name, value) {
      if ('number' !== typeof value || value < 100 || value > 699) {
        throw new _yerror2['default']('E_BAD_STATUS', typeof value, value);
      }
      this._status = value;
    }
  }, {
    key: 'finish',
    value: () => finish(res) {
      this._res.statusCode = this._status || 404;
    }
  }]);

  return Headers;
})(_destination2['default']);

exports['default'] = Headers;
module.exports = exports['default'];