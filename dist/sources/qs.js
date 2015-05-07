'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { desc = parent = getter = undefined; _again = false; var object = _x,
    property = _x2,
    receiver = _x3; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _source = require('../source');

var _source2 = _interopRequireDefault(_source);

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

var _miniquery = require('miniquery');

var _miniquery2 = _interopRequireDefault(_miniquery);

'use strict';

var QueryString = (function (_Source) {
  function QueryString(req) {
    _classCallCheck(this, QueryString);

    _get(Object.getPrototypeOf(QueryString.prototype), 'constructor', this).call(this, 'qs');
    this.req = req;
    this.parsedQuery = null;
  }

  _inherits(QueryString, _Source);

  _createClass(QueryString, [{
    key: 'get',
    value: function get(query) {
      if (!this.parsedQuery) {
        var index = this.req.url.indexOf('?');
        this.parsedQuery = -1 !== index ? _querystring2['default'].parse(this.req.url.substring(index + 1)) : {};
      }
      return _miniquery2['default'](query, [this.parsedQuery]);
    }
  }]);

  return QueryString;
})(_source2['default']);

exports['default'] = QueryString;
module.exports = exports['default'];