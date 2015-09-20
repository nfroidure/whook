import YError from 'yerror';
import Destination from '../destination';
import debug from 'debug';

let log = debug('whook.destinations.status');

export default class Headers extends Destination {
  constructor(res, name = 'status') {
    super(res, name);
    this._status = 0;
  }
  set(name, value) {
    if('number' !== typeof value || 100 > value || 699 < value) {
      throw new YError('E_BAD_STATUS', typeof value, value);
    }
    this._status = value;
    log('Set', value);
  }
  finish() {
    // Fallback to 500 since a whook using status should have set it
    // even when erroring. It should never happen, so let's consider this as
    // a server error.
    this._res.statusCode = this._status || 500;
    log('Finish', this._res.statusCode);
  }
}
