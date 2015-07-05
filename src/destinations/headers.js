'use strict';

import Destination from '../destination';

export default class Headers extends Destination {
  constructor(res, name = 'headers') {
    super(res, name);
    this._headers = new Set();
  }
  set(name, value) {
    this._headers.add({
      name,
      value
    });
  }
  finish(res) {
    for(let header of this._headers) {
      this._res.setHeader(header.name, header.value);
    }
  }
}
