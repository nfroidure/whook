import Source from '../source';
import querystring from 'querystring';
import miniquery from 'miniquery';
import debug from 'debug';

let log = debug('whook.sources.qs');

export default class QueryString extends Source {
  constructor(req, name = 'qs') {
    super(req, name);
    this._parsedQuery = null;
  }
  get(query) {
    let values;

    if(!this._parsedQuery) {
      let index = this._req.url.indexOf('?');

      this._parsedQuery = -1 !== index ?
        querystring.parse(this._req.url.substring(index + 1)) :
        {};
    }
    values = miniquery(query, [this._parsedQuery]).map((value) => {
      if('true' === value) {
        return true;
      } else if('false' === value) {
        return false;
      }
      return value;
    });

    log('Get', query, values);

    return values;
  }
}
