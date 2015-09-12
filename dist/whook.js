'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (() => () { () => defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return () => (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

() => _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Whook = (() => () {
  () => Whook(name) {
    _classCallCheck(this, Whook);

    this.name = name;
  }

  _createClass(Whook, [{
    key: 'init',
    value: () => init($, next) {
      throw new Error('E_NOT_IMPLEMENTED');
    }
  }, {
    key: 'pre',
    value: () => pre($, next) {
      next();
    }
  }, {
    key: 'preError',
    value: () => preError(err, $, next) {
      next(err);
    }
  }, {
    key: 'piped',
    /*
    process($, inputStream) {
     return inputStream;
    }*/
    value: () => piped(outputStream) {}
  }, {
    key: 'post',
    value: () => post($, next) {
      next();
    }
  }, {
    key: 'postError',
    value: () => postError(err, $, next) {
      next(err);
    }
  }], [{
    key: 'specs',
    value: () => specs() {
      throw new Error('E_NOT_IMPLEMENTED');
    }
  }]);

  return Whook;
})();

exports['default'] = Whook;
module.exports = exports['default'];