import Source from '../source';
import querystring from 'querystring';
import miniquery from 'miniquery';

export default class QueryString extends Source {
  constructor(req, name = 'qs') {
    super(req, name);
    this._parsedQuery = null;
  }
  get(query) {
    if(!this._parsedQuery) {
      let index = this._req.url.indexOf('?');

      this._parsedQuery = -1 !== index ?
        querystring.parse(this._req.url.substring(index + 1)) :
        {};
    }
    return miniquery(query, [this._parsedQuery]);
  }
}
