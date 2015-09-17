import Source from '../source';
import debug from 'debug';

let log = debug('whook.sources.headers');

// TODO: Cast all headers
// see https://en.wikipedia.org/wiki/List_of_HTTP_header_fields
let HEADERS_CASTS = {
  'content-length': Number,
  'max-forwards': Number,
};

export default class HeadersSource extends Source {
  constructor(req, name = 'headers') {
    super(req, name);
  }
  get(name) {
    let key = name.toLowerCase();
    let values = [
      HEADERS_CASTS[key] ?
      HEADERS_CASTS[key](this._req.headers[key]) :
      this._req.headers[key],
    ];

    log('Get', name, values);

    return values;
  }
}
