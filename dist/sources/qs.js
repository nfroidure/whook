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

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

var _miniquery = require('miniquery');

var _miniquery2 = _interopRequireDefault(_miniquery);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var log = (0, _debug2['default'])('whook.sources.qs');

var QueryString = (function (_Source) {
  _inherits(QueryString, _Source);

  function QueryString(req) {
    var name = arguments.length <= 1 || arguments[1] === undefined ? 'qs' : arguments[1];

    _classCallCheck(this, QueryString);

    _get(Object.getPrototypeOf(QueryString.prototype), 'constructor', this).call(this, req, name);
    this._parsedQuery = null;
  }

  _createClass(QueryString, [{
    key: 'get',
    value: function get(query) {
      var values = undefined;

      if (!this._parsedQuery) {
        var index = this._req.url.indexOf('?');

        this._parsedQuery = -1 !== index ? _querystring2['default'].parse(this._req.url.substring(index + 1)) : {};
      }
      values = (0, _miniquery2['default'])(query, [this._parsedQuery]).map(function (value) {
        if ('true' === value) {
          return true;
        } else if ('false' === value) {
          return false;
        }
        return value;
      });

      log('Get', query, values);

      return values;
    }
  }]);

  return QueryString;
})(_source2['default']);

exports['default'] = QueryString;
module.exports = exports['default'];