/**
 * Instanciate plugs (sources/destinations)
 * @param  {Map}      plugClassesMap   Map of plugs classes to instanciate.
 * @param  {...Mixed} args             Arguments to use while instanciating.
 * @return {Map}                       A map og plugs instances
 */
export const instanciatePlugs = function instanciatePlugs(plugClassesMap, ...args) {
  let plugInstancesMap = new Map();
  for(let [name, PlugClass] of plugClassesMap) {
    plugInstancesMap.set(
      name,
      new PlugClass(...args.concat([name]))
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
    let specProperty = 'source' === type ? 'in' : 'out';

    return (
      specs[specProperty] && specs[specProperty].properties ?
      Object.keys(specs[specProperty].properties).map((key) => {
        return specs[specProperty].properties[key];
      }) :
      []
    ).reduce((plugNames, property) => {
      let plugName = property[type].split(':')[0];

      if(-1 === plugNames.indexOf(plugName)) {
        plugNames.push(plugName);
      }
      return plugNames;
    }, []);
  };

export const getPlugsMapping = function getPlugsMapping(whooksMounts) {
  let sourcesMapping = {};
  let destinationsMapping = {};
  let servicesMapping = {};

  whooksMounts.forEach(({ specs: { services, sources, destinations } }) => {
    services && Object.keys(services).forEach((key) => {
      if('undefined' !== typeof servicesMapping[key]) {
        // debug('Service key redefinition!')
      }
      servicesMapping[key] = specs.services[key];
    });
    sources && Object.keys(sources).forEach((key) => {
      ;
    });
    destinations && Object.keys(destinations).forEach((key) => {
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
