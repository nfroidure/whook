'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (() => () { () => defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return () => (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

() => _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Source = (() => () {
  () => Source(req, name) {
    _classCallCheck(this, Source);

    if ('object' !== typeof req) {
      throw new Error('E_BAD_SOURCE_REQUEST');
    }
    if ('string' !== typeof name) {
      throw new Error('E_BAD_SOURCE_NAME');
    }
    this._req = req;
    this.name = name;
  }

  _createClass(Source, [{
    key: 'get',
    value: () => get(query) {
      throw new Error('E_NOT_IMPLEMENTED');
    }
  }]);

  return Source;
})();

exports['default'] = Source;
module.exports = exports['default'];