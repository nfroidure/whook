'use strict';

export default class Destination {
  constructor(name, req) {
    this.name = name;
    this.req = req;
  }
  set(query, value) {
    throw new Error('E_NOT_IMPLEMENTED');
  }
}
