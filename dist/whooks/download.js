'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _whook = require('../whook');

var _whook2 = _interopRequireDefault(_whook);

var DownloadWhook = (function (_Whook) {
  function DownloadWhook() {
    _classCallCheck(this, DownloadWhook);

    _get(Object.getPrototypeOf(DownloadWhook.prototype), 'constructor', this).call(this, 'download');
  }

  _inherits(DownloadWhook, _Whook);

  _createClass(DownloadWhook, [{
    key: 'init',
    value: function init() {}
  }, {
    key: 'pre',
    value: function pre(_ref, next) {
      var _ref$in = _ref['in'];
      var download = _ref$in.download;
      var filename = _ref$in.filename;
      var out = _ref.out;
      var log = _ref.services.log;

      if (download) {
        out.contentDisposition = 'attachment' + (filename ? '; filename="' + filename + '"' : '');
        log && log(this.name, 'out.contentDisposition set to:', out.contentDisposition);
      }
      next();
    }
  }], [{
    key: 'specs',
    value: function specs() {
      return {
        nodes: [],
        methods: ['GET'],
        'in': {
          $schema: 'http://json-schema.org/draft-04/schema#',
          title: 'Input',
          type: 'object',
          properties: {
            download: {
              source: 'qs:download',
              type: 'boolean',
              'default': false,
              description: 'Whether the download header should be added or not.'
            },
            filename: {
              source: 'qs:filename',
              type: 'string',
              'default': '',
              description: 'The filename under wich the download should be saved.'
            }
          }
        },
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
        },
        services: {
          log: ''
        }
      };
    }
  }]);

  return DownloadWhook;
})(_whook2['default']);

exports['default'] = DownloadWhook;
module.exports = exports['default'];