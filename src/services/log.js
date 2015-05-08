'use strict';

import Service from '../service';

// A simple log service
export default class extends Service {
  constructor(name = 'logger') {
    super(name)
  }
  log() {
    console.log.apply(console, arguments);
  }
}
