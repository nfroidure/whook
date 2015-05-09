'use strict';

export default class Source {
  constructor(name, req) {
    this.name = name;
    this.req = req;
  }
  get(query) {
    throw new Error('E_NOT_IMPLEMENTED');
  }
  static instantiateSourcesFromReq(sources, names, req) {
    return names.map((name) => new (this.sources.get(name))(name, req))
      .reduce((sourcesMap, source) => {
        destinationsMap[source.name] = source;
        return sourcesMap;
      }, {});
  }
}
