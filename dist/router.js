'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _utils = require('./utils');

var _yerror = require('yerror');

var _yerror2 = _interopRequireDefault(_yerror);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var log = (0, _debug2['default'])('whook.router');

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
    this.whooksTree = _buildTreeNode();
    this._whookMounts = [];
    this._whooksCache = new Map();
    this._mounted = false;
  }

  _createClass(Router, [{
    key: 'service',
    value: function service(name, _service) {
      this._checkMounted();
      this.services.set(name, _service);
      log('Registering service:', name);
      return this;
    }
  }, {
    key: 'source',
    value: function source(name, _source) {
      this._checkMounted();
      this.sources.set(name, _source);
      log('Registering source:', name);
      return this;
    }
  }, {
    key: 'destination',
    value: function destination(name, _destination) {
      this._checkMounted();
      this.destinations.set(name, _destination);
      log('Registering destination:', name);
      return this;
    }
  }, {
    key: 'add',
    value: function add(specs, whook) {
      var whookMount = { specs: specs, whook: whook };
      this._checkMounted();
      this._whookMounts.push(whookMount);
      this._whooksCache.set(whookMount, {
        sourceNames: (0, _utils.getInvolvedPlugsNameFromSpecs)(specs, 'source'),
        destinationNames: (0, _utils.getInvolvedPlugsNameFromSpecs)(specs, 'destination')
      });
      log('Registering a whook:', whook.constructor.name);
      return this;
    }
  }, {
    key: 'callback',
    value: function callback() {
      var _this = this;

      if (!this._whookMounts) {
        throw new Error('E_NOTHING_MOUNTED');
      }
      this._mounted = true;
      log('Mounting the router.');
      return function (req, res) {
        _this._handle(req, res);
      };
    }
  }, {
    key: '_handle',
    value: function _handle(req, res) {
      var _this2 = this;

      log('Handling a new request.');
      // Get the whooks to complete the incoming message
      var involvedWhookMounts = this._prepareWhooksChain(req);
      log('Found ' + involvedWhookMounts.length + ' whooks for her.');
      // Instantiate plugs (destinations, sources)
      var sourcesMap = (0, _utils.instanciatePlugs)(involvedWhookMounts.reduce(function (sourceNames, whook) {
        _this2._whooksCache.get(whook).sourceNames.forEach(function (name) {
          if (-1 === sourceNames.indexOf(name)) {
            sourceNames.push(name);
          }
        });
        return sourceNames;
      }, []).reduce(function (sourcesMap, name) {
        sourcesMap.set(name, _this2.sources.get(name));
        return sourcesMap;
      }, new Map()), req);
      log(sourcesMap.size + ' sources prepared.');
      var destinationsMap = (0, _utils.instanciatePlugs)(involvedWhookMounts.reduce(function (destinationNames, whook) {
        _this2._whooksCache.get(whook).destinationNames.forEach(function (name) {
          if (-1 === destinationNames.indexOf(name)) {
            destinationNames.push(name);
          }
        });
        return destinationNames;
      }, []).reduce(function (destinationsMap, name) {
        destinationsMap.set(name, _this2.destinations.get(name));
        return destinationsMap;
      }, new Map()), res);
      log(destinationsMap.size + ' destinations prepared.');
      // Prepare contexts
      var contexts = this._prepareContexts(involvedWhookMounts, sourcesMap, destinationsMap, this.services);
      log('Context objects successfully prepared.', contexts);
      // execute pre
      this._runNextWhookMount(involvedWhookMounts, 'pre', 0, contexts)
      // if err stop executing pre, execute preError
      ['catch'](function (err) {
        log('Got an error on the "pre" hook', err.stack);
        return _this2._runNextWhookMount(involvedWhookMounts, 'preError', 0, contexts, err);
      })
      // process streams
      .then(function () {
        var incomingStream = new _stream2['default'].PassThrough();
        var pipeline = incomingStream;
        pipeline.on('error', function (err) {
          log('Pipeline stream errored.', err);
          reject(err);
        }).on('end', function () {
          log('Pipeline stream successfully ended.');
        });
        return new Promise(function (resolve, reject) {
          // create the pipeline
          involvedWhookMounts.forEach(function (whookMount, index) {
            if (whookMount.whook.process) {
              pipeline = whookMount.whook.process(contexts[index], pipeline);
              if (!pipeline) {
                throw new _yerror2['default']('E_BAD_PROCESS_RETURN', whookMount.whook.name, pipeline);
              }
              pipeline.on('error', function (err) {
                log('Whook stream "' + whookMount.whook.name + '" errored.', err);
                reject(err);
              }).on('end', function () {
                log('Whook stream "' + whookMount.whook.name + '" successfully ended.');
              });
            }
          });
          // flush destination headers
          involvedWhookMounts.forEach(function (whookMount, index) {
            _this2._applyWhookOutput(whookMount, destinationsMap, contexts[index]);
          });
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = destinationsMap[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var _step$value = _slicedToArray(_step.value, 2);

              var name = _step$value[0];
              var destination = _step$value[1];

              destination.finish();
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator['return']) {
                _iterator['return']();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }

          // run piped step
          _this2._runNextWhookMount(involvedWhookMounts, 'piped', 0, contexts).then(function () {
            // pipe
            req.pipe(res); /*
                           .on('error', (err) => {
                           log('Request stream errored.', err);
                           reject(err);
                           })
                           .on('end', () => {
                           log('Request stream successfully ended.');
                           })
                           .pipe(incomingStream)
                           .pipe(res)
                           .on('error', (err) => {
                           log('Response stream errored.', err);
                           reject(err);
                           })
                           .on('end', function() {
                           log('Response stream successfully ended.', contexts);
                           })
                           .on('finish', function() {
                           log('Response stream successfully finished.', contexts);
                           })
                           .on('ended', resolve);*/
          });
        });
      })
      // execute post
      .then(function () {
        return _this2._runNextWhookMount(involvedWhookMounts, 'post', 0, contexts);
      })
      // if err stop executing post, execute postError
      ['catch'](function (err) {
        log('Got an error on the "post" hook', err.stack);
        return _this2._runNextWhookMount(involvedWhookMounts, 'postError', 0, contexts, err);
      });
    }
  }, {
    key: '_checkMounted',
    value: function _checkMounted() {
      if (this._mounted) {
        throw new Error('E_ALREADY_MOUNTED');
      }
    }
  }, {
    key: '_prepareContexts',
    value: function _prepareContexts(involvedWhookMounts, sourcesMap, destinationsMap, services) {
      var _this3 = this;

      var contexts = [];
      involvedWhookMounts.forEach(function (whookMount, index) {
        var context = {
          'in': {},
          out: {},
          services: (0, _utils.mapPlugs)(_this3.services, whookMount.specs.services)
        };
        _this3._prepareWhookInput(whookMount, sourcesMap, context);
        contexts[index] = context;
      });
      return contexts;
    }
  }, {
    key: '_prepareWhookInput',
    value: function _prepareWhookInput(whookMount, sourcesMap, $) {
      (whookMount.specs['in'] && whookMount.specs['in'].properties ? Object.keys(whookMount.specs['in'].properties) : []).forEach(function (propertyName) {
        var property = whookMount.specs['in'].properties[propertyName];

        var _property$source$split = property.source.split(':');

        var _property$source$split2 = _slicedToArray(_property$source$split, 2);

        var source = _property$source$split2[0];
        var query = _property$source$split2[1];

        var result = sourcesMap.get(source).get(query);
        if (result.length) {
          $['in'][propertyName] = result[0];
        } else {
          $['in'][propertyName] = '';
        }
      });
    }
  }, {
    key: '_applyWhookOutput',
    value: function _applyWhookOutput(whookMount, destinationsMap, $) {
      (whookMount.specs.out && whookMount.specs.out.properties ? Object.keys(whookMount.specs.out.properties) : []).forEach(function (propertyName) {
        var property = whookMount.specs.out.properties[propertyName];

        var _property$destination$split = property.destination.split(':');

        var _property$destination$split2 = _slicedToArray(_property$destination$split, 2);

        var destination = _property$destination$split2[0];
        var query = _property$destination$split2[1];

        if ('undefined' !== typeof $.out[propertyName]) {
          destinationsMap.get(destination).set(query, $.out[propertyName]);
        }
      });
    }
  }, {
    key: '_prepareWhooksChain',
    value: function _prepareWhooksChain(req) {
      var nodes = req.url.split('?')[0].split('/').slice(1);
      return this._whookMounts.filter(function (whookMount) {
        return 0 === whookMount.specs.nodes.length || nodes.length >= whookMount.specs.nodes.length && nodes.every(function (node, index) {
          return 'undefined' === typeof whookMount.specs.nodes[index] || (whookMount.specs.nodes[index] instanceof RegExp ? whookMount.specs.nodes[index].test(node) : whookMount.specs.nodes[index] === node);
        });
      });
    }
  }, {
    key: '_runNextWhookMount',
    value: function _runNextWhookMount(involvedWhookMounts, step, index, contexts, err) {
      var _this4 = this;

      if (!involvedWhookMounts[index]) {
        return Promise.resolve();
      }
      if (!contexts[index]) {
        return Promise.reject(new Error('E_BAD_CONTEXT'));
      }
      return this._runWhook(involvedWhookMounts[index].whook, step, contexts[index], err).then(function () {
        return _this4._runNextWhookMount(involvedWhookMounts, step, ++index, contexts, err);
      });
    }
  }, {
    key: '_runWhook',
    value: function _runWhook(whook, step, $, err) {
      if (!whook[step]) {
        return Promise.resolve();
      }
      return new Promise(function (resolve, reject) {
        // There is no next function, run synchonously
        if (whook[step].length < 2) {
          try {
            whook[step]($, err);
            resolve();
          } catch (err) {
            reject(err);
          }
          return;
        }
        // Otherwise, let's go async ;)
        whook[step]($, function whookNextFunction(err) {
          if (err) {
            reject(err);
          }
          resolve();
        });
      });
    }
  }]);

  return Router;
})();

exports['default'] = Router;