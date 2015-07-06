'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _whook = require('../whook');

var _whook2 = _interopRequireDefault(_whook);

var TimeHook = (function (_Whook) {
  function TimeHook() {
    _classCallCheck(this, TimeHook);

    _get(Object.getPrototypeOf(TimeHook.prototype), 'constructor', this).apply(this, arguments);
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

      out.statusCode = 200;
      out.contentType = 'text/plain';
      next();
    }
  }, {
    key: 'process',

    // Logic applyed to response/request abstract data when sending response content
    value: function process(_ref2, inStream) {
      var format = _ref2['in'].format;
      var out = _ref2.out;
      var time = _ref2.services.time;

      var curTime = new Date(time())['iso' === format ? 'toISOString' : 'getTime']().toString();
      var outStream = new _stream2['default'].PassThrough();
      out.contentLength = curTime.length;
      inStream.on('data', function (chunk) {
        outStream.emit('error', new YError('E_UNEXPECTED_CONTENT'));
      });
      inStream.on('end', function () {
        outStream.write(curTime);
        outStream.end();
      });
      return outStream;
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
            statusCode: {
              type: 'number',
              required: true,
              destination: 'status',
              'enum': [200]
            },
            contentType: {
              type: 'string',
              required: true,
              destination: 'headers:Content-Type',
              'enum': ['text/plain']
            },
            contentLength: {
              type: 'number',
              required: true,
              destination: 'headers:Content-Length'
            }
          }
        },
        services: {
          log: '',
          time: ''
        }
      };
    }
  }]);

  return TimeHook;
})(_whook2['default']);

exports['default'] = TimeHook;
module.exports = exports['default'];