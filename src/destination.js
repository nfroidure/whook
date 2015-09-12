export default class Destination {
  constructor(res, name) {
    this._res = res;
    this.name = name;
  }
  set() {
    throw new Error('E_NOT_IMPLEMENTED');
  }
}
