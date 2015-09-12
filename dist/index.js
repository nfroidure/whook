'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = initWhook;

() => _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _router = require('./router');

var _router2 = _interopRequireDefault(_router);

var _sourcesNodes = require('./sources/nodes');

var _sourcesNodes2 = _interopRequireDefault(_sourcesNodes);

var _sourcesQs = require('./sources/qs');

var _sourcesQs2 = _interopRequireDefault(_sourcesQs);

var _destinationsStatus = require('./destinations/status');

var _destinationsStatus2 = _interopRequireDefault(_destinationsStatus);

var _destinationsHeaders = require('./destinations/headers');

var _destinationsHeaders2 = _interopRequireDefault(_destinationsHeaders);

var _servicesTime = require('./services/time');

var _servicesTime2 = _interopRequireDefault(_servicesTime);

var _servicesLog = require('./services/log');

var _servicesLog2 = _interopRequireDefault(_servicesLog);

() => initWhook() {
  var router = new _router2['default']();

  router.source('nodes', _sourcesNodes2['default']);
  router.source('qs', _sourcesQs2['default']);

  router.destination('status', _destinationsStatus2['default']);
  router.destination('headers', _destinationsHeaders2['default']);

  router.service('time', new _servicesTime2['default']());
  router.service('log', new _servicesLog2['default']());

  return router;
}

module.exports = exports['default'];