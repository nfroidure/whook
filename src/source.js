import YError from 'yerror';

export default class Source {
  constructor(req, name) {
    if('object' !== typeof req) {
      throw new YError('E_BAD_SOURCE_REQUEST', typeof req, req);
    }
    if('string' !== typeof name) {
      throw new YError('E_BAD_SOURCE_NAME', typeof name, name);
    }
    this._req = req;
    this.name = name;
  }
  get() {
    throw new Error('E_NOT_IMPLEMENTED');
  }
}
