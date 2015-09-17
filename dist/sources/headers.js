'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _source = require('../source');

var _source2 = _interopRequireDefault(_source);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var log = (0, _debug2['default'])('whook.sources.headers');

// TODO: Cast all headers
// see https://en.wikipedia.org/wiki/List_of_HTTP_header_fields
var HEADERS_CASTS = {
  'content-length': Number,
  'max-forwards': Number
};

var HeadersSource = (function (_Source) {
  _inherits(HeadersSource, _Source);

  function HeadersSource(req) {
    var name = arguments.length <= 1 || arguments[1] === undefined ? 'headers' : arguments[1];

    _classCallCheck(this, HeadersSource);

    _get(Object.getPrototypeOf(HeadersSource.prototype), 'constructor', this).call(this, req, name);
  }

  _createClass(HeadersSource, [{
    key: 'get',
    value: function get(name) {
      var key = name.toLowerCase();
      var values = [HEADERS_CASTS[key] ? HEADERS_CASTS[key](this._req.headers[key]) : this._req.headers[key]];

      log('Get', name, values);

      return values;
    }
  }]);

  return HeadersSource;
})(_source2['default']);

exports['default'] = HeadersSource;
module.exports = exports['default'];