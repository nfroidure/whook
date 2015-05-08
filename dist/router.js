'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

'use strict';

var WHOOK_SYMBOL = Symbol('WhooksSymbol');

exports.WHOOK_SYMBOL = WHOOK_SYMBOL;
function _buildTreeNode() {
  var node = {};
  Object.defineProperty(node, WHOOK_SYMBOL, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: []
  });
  return node;
}

var Router = (function () {
  function Router(config, parent) {
    _classCallCheck(this, Router);

    this.config = config;
    this.services = new Map();
    this.sources = new Map();
    this.destinations = new Map();
    this.tree = _buildTreeNode();
    this.mounted = false;
  }

  _createClass(Router, [{
    key: 'service',
    value: function service(name, service) {
      this.services.set(name, service);
      return this;
    }
  }, {
    key: 'source',
    value: function source(name, source) {
      this.sources.set(name, source);
      return this;
    }
  }, {
    key: 'destination',
    value: function destination(name, destination) {
      this.destinations.set(name, destination);
      return this;
    }
  }, {
    key: 'add',
    value: function add(spec, whook) {
      var curNode = this.tree;
      if (spec.nodes && spec.nodes.length) {
        spec.nodes.forEach(function (node, index, _ref) {
          var length = _ref.length;

          if (!curNode[node]) {
            curNode[node] = _buildTreeNode();
          }
          curNode = curNode[node];
        });
      }
      curNode[WHOOK_SYMBOL].push({ spec: spec, whook: whook });
      return this;
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

exports['default'] = Router;