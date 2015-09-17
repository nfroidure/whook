'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _yerror = require('yerror');

var _yerror2 = _interopRequireDefault(_yerror);

var _whook = require('../whook');

var _whook2 = _interopRequireDefault(_whook);

var EchoHook = (function (_Whook) {
  _inherits(EchoHook, _Whook);

  function EchoHook() {
    _classCallCheck(this, EchoHook);

    _get(Object.getPrototypeOf(EchoHook.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(EchoHook, [{
    key: 'init',
    value: function init(specs) {
      this._statusCode = specs.out.properties.statusCode['enum'][0];
    }

    // Logic applyed to response/request abstract data before sending response content
  }, {
    key: 'pre',
    value: function pre(_ref, next) {
      var _ref$in = _ref['in'];
      var contentType = _ref$in.contentType;
      var contentLength = _ref$in.contentLength;
      var out = _ref.out;

      out.statusCode = this._statusCode;
      out.contentType = contentType;
      out.contentLength = contentLength;
      next();
    }

    // Logic applyed to response/request abstract data when sending response content
  }, {
    key: 'process',
    value: function process($, inStream) {
      return inStream;
    }
  }], [{
    key: 'specs',
    value: function specs() {
      var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var _ref2$statusCode = _ref2.statusCode;
      var statusCode = _ref2$statusCode === undefined ? 200 : _ref2$statusCode;

      return {
        methods: ['POST'],
        nodes: ['echo'],
        'in': {
          $schema: 'http://json-schema.org/draft-04/schema#',
          title: 'EchoHook input specs',
          type: 'object',
          properties: {
            contentType: {
              source: 'headers:Content-Type',
              type: 'string',
              description: 'The type of the content to echo.'
            },
            contentLength: {
              source: 'headers:Content-Length',
              type: 'number',
              description: 'The length of the content to echo.'
            }
          }
        },
        out: {
          $schema: 'http://json-schema.org/draft-04/schema#',
          title: 'EchoHook output specs',
          type: 'object',
          properties: {
            statusCode: {
              type: 'number',
              required: true,
              destination: 'status',
              'enum': [statusCode]
            },
            contentType: {
              type: 'string',
              destination: 'headers:Content-Type'
            },
            contentLength: {
              type: 'number',
              destination: 'headers:Content-Length'
            }
          }
        },
        services: {}
      };
    }
  }]);

  return EchoHook;
})(_whook2['default']);

exports['default'] = EchoHook;
module.exports = exports['default'];