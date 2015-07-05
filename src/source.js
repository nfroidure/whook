'use strict';

export default class Source {
  constructor(req, name) {
    if('object' !== typeof req) {
      throw new Error('E_BAD_SOURCE_REQUEST');
    }
    if('string' !== typeof name) {
      throw new Error('E_BAD_SOURCE_NAME');
    }
    this._req = req;
    this.name = name;
  }
  get(query) {
    throw new Error('E_NOT_IMPLEMENTED');
  }
}
