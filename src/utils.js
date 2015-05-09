export const mapAndInstanciate = function mapAndInstanciate(classesSet, namesMapping, ...args) {
  return Object.keys(namesMapping).map((name) => {
    return new (classesSet.get(name))(namesMapping[name] || name, ...args);
  }).reduce((instancesMap, destination) => {
    instancesMap[destination.name] = destination;
    return instancesMap;
  }, {});
}