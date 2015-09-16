import YError from 'yerror';

export default class Destination {
  constructor(res, name) {
    if('object' !== typeof res) {
      throw new YError('E_BAD_DESTINATION_RESPONSE', typeof res, res);
    }
    if('string' !== typeof name) {
      throw new YError('E_BAD_DESTINATION_NAME', typeof name, name);
    }
    this._res = res;
    this.name = name;
  }
  set() {
    throw new Error('E_NOT_IMPLEMENTED');
  }
}
