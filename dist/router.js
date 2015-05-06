'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Router = (function () {
  function Router(config, parent) {
    _classCallCheck(this, Router);

    this.config = config;
    this.services = new Map();
    this.sources = new Map();
    this.destinations = new Map();
    this.whooks = [];
    this.mounted = false;
  }

  _createClass(Router, [{
    key: 'service',
    value: function service(name, service) {
      this.services.set(name, service);
    }
  }, {
    key: 'source',
    value: function source(name, source) {
      this.sources.set(name, source);
    }
  }, {
    key: 'destination',
    value: function destination(name, destination) {
      this.destinations.set(name, destination);
    }
  }, {
    key: 'add',
    value: function add(spec, whook) {
      this.push({ spec: spec, whook: whook });
    }
  }, {
    key: 'callback',
    value: function callback() {
      if (this.mounted && !this.config.lazymount) {
        throw new Error('E_ALREADY_MOUNTED');
      }
      this.mounted = true;
    }
  }]);

  return Router;
})();