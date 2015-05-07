'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _stringToStream = require('string-to-stream');

var _stringToStream2 = _interopRequireDefault(_stringToStream);

var _whook = require('../whook');

var _whook2 = _interopRequireDefault(_whook);

'use strict';

var TimeHook = (function (_Whook) {
  function TimeHook() {
    _classCallCheck(this, TimeHook);

    if (_Whook != null) {
      _Whook.apply(this, arguments);
    }
  }

  _inherits(TimeHook, _Whook);

  _createClass(TimeHook, [{
    key: 'init',
    value: function init() {}
  }, {
    key: 'pre',

    // Logic applyed to response/request abstract data before sending response content
    value: function pre(_ref, next) {
      var out = _ref.out;

      out.contentType = 'text/plain';
      next();
    }
  }, {
    key: 'process',

    // Logic applyed to response/request abstract data before sending response content
    value: function process(_ref2) {
      var format = _ref2['in'].format;
      var time = _ref2.services.time;

      var curTime = time();
      return _stringToStream2['default'](new Date(time())['iso' === format ? 'toISOString' : 'getTime']().toString());
    }
  }], [{
    key: 'specs',
    value: function specs() {
      return {
        methods: ['GET'], // Apply to GET requests only
        nodes: ['time'], // Hook will be mounted to /time API endpoint
        'in': {
          $schema: 'http://json-schema.org/draft-04/schema#',
          title: 'TimeHook input specs',
          type: 'object',
          properties: {
            format: {
              source: 'qs:format', // value will be picked in query parameters (?format)
              type: 'string',
              'default': 'timestamp',
              'enum': ['timestamp', 'iso'],
              description: 'The output format of the provided time.'
            }
          }
        },
        out: {
          $schema: 'http://json-schema.org/draft-04/schema#',
          title: 'TimeHook output specs',
          type: 'object',
          properties: {
            status: {
              type: 'number',
              required: true,
              destination: 'status' },
            contentType: {
              type: 'string',
              required: true,
              destination: 'headers:Content-Type' }
          }
        },
        services: {
          log: ''
        }
      };
    }
  }]);

  return TimeHook;
})(_whook2['default']);

exports['default'] = TimeHook;
module.exports = exports['default'];