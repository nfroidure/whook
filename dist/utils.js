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

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var instanciatePlugs = function instanciatePlugs(plugClassesMap) {
  var plugInstancesMap = new Map();
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    for (var _iterator = plugClassesMap[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = _slicedToArray(_step.value, 2);

      var _name = _step$value[0];
      var PlugClass = _step$value[1];

      plugInstancesMap.set(_name, new (_bind.apply(PlugClass, [null].concat(_toConsumableArray(args.concat([_name])))))());
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
var getInvolvedPlugsNameFromSpecs = function getInvolvedPlugsNameFromSpecs(specs, type) {
  var specProperty = 'source' === type ? 'in' : 'out';

  return (specs[specProperty] && specs[specProperty].properties ? Object.keys(specs[specProperty].properties).map(function (key) {
    return specs[specProperty].properties[key];
  }) : []).reduce(function (plugNames, property) {
    var plugName = property[type].split(':')[0];

    if (-1 === plugNames.indexOf(plugName)) {
      plugNames.push(plugName);
    }
    return plugNames;
  }, []);
};

exports.getInvolvedPlugsNameFromSpecs = getInvolvedPlugsNameFromSpecs;
var mapPlugs = function mapPlugs(plugs, namesMapping) {
  return Object.keys(namesMapping).reduce(function (plugsMap, name) {
    plugsMap[namesMapping[name] || name] = plugs.get(name);
    return plugsMap;
  }, {});
};
exports.mapPlugs = mapPlugs;