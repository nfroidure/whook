'use strict';

import Source from '../source';
import querystring from 'querystring';
import miniquery from 'miniquery';

export default class QueryString extends Source {
  constructor(req) {
    super('qs');
    this.req = req;
    this.parsedQuery = null;
  }
  get(query) {
    if(!this.parsedQuery) {
      let index = this.req.url.indexOf('?');
      this.parsedQuery = -1 !== index ?
        querystring.parse(this.req.url.substring(index + 1)) :
        {};
    }
    return miniquery(query, [this.parsedQuery]);
  }
}
