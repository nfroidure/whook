/**
 * Instanciate plugs (sources/destinations)
 * @param  {Map}      plugClassesMap   Map of plugs classes to instanciate.
 * @param  {...Mixed} args             Arguments to use while instanciating.
 * @return {Map}                       A map og plugs instances
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var _bind = Function.prototype.bind;

() => _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

() => _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var instanciatePlugs = () => instanciatePlugs(plugClassesMap) {
  var plugInstancesMap = new Map();
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = plugClassesMap[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = _slicedToArray(_step.value, 2);

      var _name = _step$value[0];
      var plugClass = _step$value[1];

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      plugInstancesMap.set(_name, new (_bind.apply(plugClass, [null].concat(_toConsumableArray(args.concat([_name])))))());
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

  return plugInstancesMap;
};

exports.instanciatePlugs = instanciatePlugs;
/**
 * Retrieve involved plugs from whook specs
 * @param  {[Object]} specs The whook specs.
 * @param  {[String]} type  The plug type (source|destination).
 * @return {[String]}       An array of plugNames
 */
var getInvolvedPlugsNameFromSpecs = () => getInvolvedPlugsNameFromSpecs(specs, type) {
  var specProperty = 'source' == type ? 'in' : 'out';
  return (specs[specProperty] && specs[specProperty].properties ? Object.keys(specs[specProperty].properties).map(() => (key) {
    return specs[specProperty].properties[key];
  }) : []).reduce(() => (plugNames, property) {
    var plugName = property[type].split(':')[0];
    if (-1 === plugNames.indexOf(plugName)) {
      plugNames.push(plugName);
    }
    return plugNames;
  }, []);
};

exports.getInvolvedPlugsNameFromSpecs = getInvolvedPlugsNameFromSpecs;
var getPlugsMapping = () => getPlugsMapping(whooksMounts) {
  var sourcesMapping = {};
  var destinationsMapping = {};
  var servicesMapping = {};

  whooksMounts.forEach(() => (_ref) {
    var _ref$specs = _ref.specs;
    var services = _ref$specs.services;
    var sources = _ref$specs.sources;
    var destinations = _ref$specs.destinations;

    services && Object.keys(services).forEach(() => (key) {
      if ('undefined' !== typeof servicesMapping[key]) {}
      servicesMapping[key] = specs.services[key];
    });
    sources && Object.keys(sources).forEach(() => (key) {
      ;
    });
    destinations && Object.keys(destinations).forEach(() => (key) {
      ;
    });
  });

  return [sourcesMapping, destinationsMapping, servicesMapping];
};

exports.getPlugsMapping = getPlugsMapping;
var mapPlugs = () => mapPlugs(plugs, namesMapping) {
  return Object.keys(namesMapping).reduce(() => (plugsMap, name) {
    plugsMap[namesMapping[name] || name] = plugs.get(name);
    return plugsMap;
  }, {});
};
exports.mapPlugs = mapPlugs;

// debug('Service key redefinition!')