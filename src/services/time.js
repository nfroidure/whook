'use strict';

import Service from '../service';

// A simple time service
export default class extends Service {
  constructor(name = 'time') {
    super(name)
  }
  now() {
    return Date.now();
  }
}
