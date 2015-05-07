'use strict';

import Service from '../service';

// A simple log service
export default class extends Service {
  constructor() {
    super('logger')
  }
  log() {
    console.log.apply(console, arguments);
  }
}
