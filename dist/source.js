'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _yerror = require('yerror');

var _yerror2 = _interopRequireDefault(_yerror);

var Source = (function () {
  function Source(req, name) {
    _classCallCheck(this, Source);

    if ('object' !== typeof req) {
      throw new _yerror2['default']('E_BAD_SOURCE_REQUEST', typeof req, req);
    }
    if ('string' !== typeof name) {
      throw new _yerror2['default']('E_BAD_SOURCE_NAME', typeof name, name);
    }
    this._req = req;
    this.name = name;
  }

  _createClass(Source, [{
    key: 'get',
    value: function get() {
      throw new Error('E_NOT_IMPLEMENTED');
    }
  }]);

  return Source;
})();

exports['default'] = Source;
module.exports = exports['default'];