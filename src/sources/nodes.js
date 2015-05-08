'use strict';

import Source from '../source';

export default class QueryString extends Source {
  constructor(req, name = 'nodes') {
    super(name);
    this.req = req;
    this.nodes = null;
  }
  get(query) {
    if(!this.nodes) {
      let index = this.req.url.indexOf('?');
      this.nodes = (-1 !== index ?
        this.req.url.substr(0, index - 1) :
        this.req.url
      ).split('/').filter(function(a) {
        return a;
      });
    }
    return this.nodes[Number(query)];
  }
}
