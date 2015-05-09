'use strict';

export default class Source {
  constructor(name, req) {
    this.name = name;
    this.req = req;
  }
  get(query) {
    throw new Error('E_NOT_IMPLEMENTED');
  }
}
