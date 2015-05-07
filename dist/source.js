'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

'use strict';

var Source = (function () {
  function Source(name, req) {
    _classCallCheck(this, Source);

    this.name = name;
    this.req = req;
  }

  _createClass(Source, [{
    key: 'get',
    value: function get(query) {
      throw new Error('E_NOT_IMPLEMENTED');
    }
  }]);

  return Source;
})();

exports['default'] = Source;
module.exports = exports['default'];