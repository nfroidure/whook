import Source from '../source';
import debug from 'debug';

let log = debug('whook.sources.nodes');

export default class QueryString extends Source {
  constructor(req, name = 'nodes') {
    super(req, name);
    this.nodes = null;
  }
  get(query) {
    let value;

    if(!this.nodes) {
      let index = this._req.url.indexOf('?');

      this.nodes = (-1 !== index ?
        this._req.url.substr(0, index - 1) :
        this._req.url
      ).split('/').filter((a) => {
        return a;
      });
    }
    value = this.nodes[Number(query)];

    log('Get', query, value);

    return value;
  }
}
