import Destination from '../destination';
import debug from 'debug';

let log = debug('whook.destinations.headers');

export default class HeadersDestination extends Destination {
  constructor(res, name = 'headers') {
    super(res, name);
    this._headers = new Set();
  }
  set(name, value) {
    this._headers.add({
      name,
      value,
    });
    log('Set', name, value);
  }
  finish() {
    for(let header of this._headers) {
      this._res.setHeader(header.name, header.value);
    }
    log('Finish');
  }
}
