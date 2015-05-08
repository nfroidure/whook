'use strict';

import Destination from '../destination';

export default class Headers extends Destination {
  constructor(res, name = 'headers') {
    super(name);
    this.headers = new Set();
  }
  set(name, value) {
    this.headers.add({
      name,
      value
    });
  }
  finish(res) {
    this.headers.forEach(function(header) {
      res.setHeader(header.name, header.value);
    });
  }
}
