'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Whook = (function () {
  function Whook(name) {
    _classCallCheck(this, Whook);

    this.name = name;
  }

  _createClass(Whook, [{
    key: 'init',
    value: function init($, next) {
      throw new Error('E_NOT_IMPLEMENTED');
    }
  }, {
    key: 'pre',
    value: function pre($, next) {
      next();
    }
  }, {
    key: 'preError',
    value: function preError(err, $, next) {
      next(err);
    }
  }, {
    key: 'process',
    value: function process($, next) {}
  }, {
    key: 'piped',
    value: function piped($) {}
  }, {
    key: 'post',
    value: function post($, next) {
      next();
    }
  }, {
    key: 'postError',
    value: function postError(err, $, next) {
      next(err);
    }
  }], [{
    key: 'specs',
    value: function specs() {
      throw new Error('E_NOT_IMPLEMENTED');
    }
  }]);

  return Whook;
})();

module.exports = Whook;