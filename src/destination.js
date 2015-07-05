'use strict';

export default class Destination {
  constructor(res, name) {
    this._res = res;
    this.name = name;
  }
  set(query, value) {
    throw new Error('E_NOT_IMPLEMENTED');
  }
}
