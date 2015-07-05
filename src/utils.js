/**
 * Instanciate plugs (sources/destinations)
 * @param  {Map}      plugClassesMap   Map of plugs classes to instanciate.
 * @param  {...Mixed} args             Arguments to use while instanciating.
 * @return {Map}                       A map og plugs instances
 */
export const instanciatePlugs = function instanciatePlugs(plugClassesMap, ...args) {
  var plugInstancesMap = new Map();
  for(let [name, plugClass] of plugClassesMap) {
    plugInstancesMap.set(
      name,
      new plugClass(...args.concat([name]))
    );
  }
  return plugInstancesMap;
};

/**
 * Retrieve involved plugs from whook specs
 * @param  {[Object]} specs The whook specs.
 * @param  {[String]} type  The plug type (source|destination).
 * @return {[String]}       An array of plugNames
 */
export const getInvolvedPlugsNameFromSpecs =
  function getInvolvedPlugsNameFromSpecs(specs, type) {
    var specProperty = 'source' == type ? 'in' : 'out';
    return (
      specs[specProperty] && specs[specProperty].properties ?
      Object.keys(specs[specProperty].properties).map(function(key) {
        return specs[specProperty].properties[key];
      }) :
      []
    ).reduce(function(plugNames, property) {
      var plugName = property[type].split(':')[0];
      if(-1 === plugNames.indexOf(plugName)) {
        plugNames.push(plugName);
      }
      return plugNames;
    }, []);
  };

export const getPlugsMapping = function getPlugsMapping(whooksMounts) {
  var sourcesMapping = {};
  var destinationsMapping = {};
  var servicesMapping = {};

  whooksMounts.forEach(function({specs: {services, sources, destinations}}) {
    services && Object.keys(services).forEach(function(key) {
      if('undefined' !== typeof servicesMapping[key]) {
        // debug('Service key redefinition!')
      }
      servicesMapping[key] = specs.services[key];
    });
    sources && Object.keys(sources).forEach(function(key) {
      ;
    });
    destinations && Object.keys(destinations).forEach(function(key) {
      ;
    });
  });

  return [sourcesMapping, destinationsMapping, servicesMapping];
};

export const mapPlugs = function mapPlugs(plugs, namesMapping) {
  return Object.keys(namesMapping).reduce((plugsMap, name) => {
    plugsMap[namesMapping[name] || name] = plugs.get(name);
    return plugsMap;
  }, {});
};
