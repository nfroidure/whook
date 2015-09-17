'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _utils = require('./utils');

var _yerror = require('yerror');

var _yerror2 = _interopRequireDefault(_yerror);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _ajv = require('ajv');

var _ajv2 = _interopRequireDefault(_ajv);

var log = (0, _debug2['default'])('whook.router');
var ajv = new _ajv2['default']();

var Router = (function () {
  function Router(config) {
    _classCallCheck(this, Router);

    this.config = config;
    this.services = new Map();
    this.sources = new Map();
    this.destinations = new Map();
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

      log('Registering a whook:', whook.constructor.name);
      this._checkMounted();
      this._whookMounts.push(whookMount);
      this._whooksCache.set(whookMount, {
        inValidate: ajv.compile(specs['in'] || {}),
        outValidate: ajv.compile(specs['in'] || {}),
        sourceNames: (0, _utils.getInvolvedPlugsNameFromSpecs)(specs, 'source'),
        destinationNames: (0, _utils.getInvolvedPlugsNameFromSpecs)(specs, 'destination')
      });
      whook.init(specs);
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

      var involvedWhookMounts = undefined;
      var sourcesMap = undefined;
      var destinationsMap = undefined;
      var contexts = undefined;

      log('Handling a new request.');

      // Erase default statusCode
      res.statusCode = -1;

      // Get the whooks to complete the incoming message
      involvedWhookMounts = this._getInvolvedWhooksMount(req);

      // Instantiate plugs (destinations, sources)
      sourcesMap = (0, _utils.instanciatePlugs)(this._getPlugsMapFromWhookMounts(involvedWhookMounts, 'source'), req);
      destinationsMap = (0, _utils.instanciatePlugs)(this._getPlugsMapFromWhookMounts(involvedWhookMounts, 'destination'), res);

      // Prepare contexts
      contexts = this._prepareContexts(involvedWhookMounts, sourcesMap, destinationsMap, this.services);
      log('Context objects successfully prepared.', contexts);

      // Check input
      this._validateWhooksInput(involvedWhookMounts, contexts)
      // execute pre when no error
      .then(this._runNextWhookMount.bind(this, involvedWhookMounts, 'pre', 0, contexts))
      // Check output
      .then(this._validateWhooksOutput(involvedWhookMounts, contexts))
      // if err stop/avoid executing pre, execute preError
      ['catch'](function (err) {
        log('Got an error on the "pre" hook', err.stack);
        return _this2._runNextWhookMount(involvedWhookMounts, 'preError', 0, contexts, err);
      })
      // process streams
      .then(function () {
        var incomingStream = new _stream2['default'].PassThrough();
        var pipeline = incomingStream;

        return new Promise(function (resolve, reject) {
          // create the pipeline
          pipeline = _this2._prepareWhooksPipeline(involvedWhookMounts, contexts, pipeline);
          // flush destinations
          involvedWhookMounts.forEach(function (whookMount, index) {
            _this2._applyWhookOutput(whookMount, destinationsMap, contexts[index]);
          });
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = destinationsMap[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var _step$value = _slicedToArray(_step.value, 2);

              var _name = _step$value[0];
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

          if (-1 === res.statusCode) {
            log('No status code were set, fallbacking to 404!');
            res.statusCode = 404;
          }
          // run piped step
          _this2._runNextWhookMount(involvedWhookMounts, 'piped', 0, contexts).then(function () {
            // pipe
            req.on('error', function (err) {
              log('Request stream errored.', err);
              reject(err);
            }).on('end', function () {
              log('Request stream successfully ended.');
            }).pipe(incomingStream);
            if (incomingStream === pipeline) {
              log('Request stream unprocessed.');
            }
            pipeline.pipe(res).on('error', function (err) {
              log('Response stream errored.', err);
              reject(err);
            }).on('end', function () {
              log('Response stream successfully ended.', contexts);
            }).on('finish', function () {
              log('Response stream successfully finished.', contexts);
            }).on('ended', resolve);
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
    key: '_getPlugsMapFromWhookMounts',
    value: function _getPlugsMapFromWhookMounts(whookMounts, plugType) {
      var _this3 = this;

      var plugsMap = whookMounts.reduce(function (plugNames, whookMount) {
        log('Looking for "' + whookMount.whook.name + '" whook mount in the cache.');
        _this3._whooksCache.get(whookMount)[plugType + 'Names'].forEach(function (name) {
          if (-1 === plugNames.indexOf(name)) {
            plugNames.push(name);
          }
        });
        return plugNames;
      }, []).reduce(function (plugsMap, name) {
        var plug = _this3[plugType + 's'].get(name);

        if (!plug) {
          // Maybe check this in router.add ?
          throw new _yerror2['default']('E_UNKNOW_' + plugType.toUpperCase(), name);
        }
        plugsMap.set(name, plug);
        return plugsMap;
      }, new Map());

      log(plugsMap.size + ' ' + plugType + 's prepared.');
      return plugsMap;
    }
  }, {
    key: '_prepareContexts',
    value: function _prepareContexts(involvedWhookMounts, sourcesMap) {
      var _this4 = this;

      var contexts = [];

      involvedWhookMounts.forEach(function (whookMount, index) {
        var context = {
          'in': {},
          out: {},
          services: (0, _utils.mapPlugs)(_this4.services, whookMount.specs.services)
        };

        _this4._prepareWhookInput(whookMount, sourcesMap, context);
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

        var results = sourcesMap.get(source).get(query);

        if (results.length) {
          $['in'][propertyName] = results[0];
        } else if ('undefined' !== typeof property['default']) {
          $['in'][propertyName] = property['default'];
        }
      });
    }
  }, {
    key: '_validateWhooksInput',
    value: function _validateWhooksInput(whookMounts, contexts) {
      var _this5 = this;

      var errors = whookMounts.reduce(function (errors, whookMount, i) {
        var validate = _this5._whooksCache.get(whookMount).inValidate;

        if (!validate(contexts[i]['in'] || {})) {
          errors = errors.concat(validate.errors);
        }
        return errors;
      }, []);

      if (errors.length) {
        log('Found errors in input.', errors);
        return Promise.reject(new _yerror2['default']('E_BAD_INPUT', errors));
      }
      return Promise.resolve();
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
    key: '_validateWhooksOutput',
    value: function _validateWhooksOutput(whookMounts, contexts) {
      var _this6 = this;

      var errors = whookMounts.reduce(function (errors, whookMount, i) {
        var validate = _this6._whooksCache.get(whookMount).outValidate;

        if (!validate(contexts[i].out || {})) {
          errors = errors.concat(validate.errors);
        }
        return errors;
      }, []);

      if (errors.length) {
        log('Found errors in output.', errors);
        return Promise.reject(new _yerror2['default']('E_BAD_INPUT', errors));
      }
      return Promise.resolve();
    }
  }, {
    key: '_getInvolvedWhooksMount',
    value: function _getInvolvedWhooksMount(req) {
      var nodes = req.url.split('?')[0].split('/').slice(1);
      var involvedWhookMounts = this._whookMounts.filter(function (whookMount) {
        return 0 === whookMount.specs.nodes.length || nodes.length >= whookMount.specs.nodes.length && nodes.every(function (node, index) {
          return 'undefined' === typeof whookMount.specs.nodes[index] || (whookMount.specs.nodes[index] instanceof RegExp ? whookMount.specs.nodes[index].test(node) : whookMount.specs.nodes[index] === node);
        });
      });

      log('Found ' + involvedWhookMounts.length + ' whooks for her.');

      return involvedWhookMounts;
    }
  }, {
    key: '_prepareWhooksPipeline',
    value: function _prepareWhooksPipeline(involvedWhookMounts, contexts, pipeline, reject) {
      pipeline.on('error', function (err) {
        log('Pipeline stream errored.', err);
        reject(err);
      }).on('end', function () {
        log('Pipeline stream successfully ended.');
      });
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
      return pipeline;
    }
  }, {
    key: '_runNextWhookMount',
    value: function _runNextWhookMount(involvedWhookMounts, step, index, contexts, err) {
      var _this7 = this;

      if (!involvedWhookMounts[index]) {
        return Promise.resolve();
      }
      if (!contexts[index]) {
        return Promise.reject(new _yerror2['default']('E_BAD_CONTEXT', index));
      }
      return this._runWhook(involvedWhookMounts[index].whook, step, contexts[index], err).then(function () {
        return _this7._runNextWhookMount(involvedWhookMounts, step, ++index, contexts, err);
      });
    }
  }, {
    key: '_runWhook',
    value: function _runWhook(whook, step, $, err) {
      if (!whook[step]) {
        return Promise.resolve();
      }
      return new Promise(function whookPromiseFunction(resolve, reject) {
        // There is no next function, run synchonously
        if (2 > whook[step].length) {
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
module.exports = exports['default'];