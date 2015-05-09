'use strict';

export default class Destination {
  constructor(name, req) {
    this.name = name;
    this.req = req;
  }
  static instantiateDestinationsFromRes(destinations, names, res) {
    return names.map((name) => new (this.destinations.get(name))(name, res))
      .reduce((destinationsMap, destination) => {
        destinationsMap[destination.name] = destination;
        return destinationsMap;
      }, {});
  }
  set(query, value) {
    throw new Error('E_NOT_IMPLEMENTED');
  }
}
