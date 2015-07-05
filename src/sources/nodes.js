'use strict';

import Source from '../source';

export default class QueryString extends Source {
  constructor(req, name = 'nodes') {
    super(req, name);
    this.nodes = null;
  }
  get(query) {
    if(!this.nodes) {
      let index = this._req.url.indexOf('?');
      this.nodes = (-1 !== index ?
        this._req.url.substr(0, index - 1) :
        this._req.url
      ).split('/').filter(function(a) {
        return a;
      });
    }
    return this.nodes[Number(query)];
  }
}
