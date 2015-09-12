/* eslint no-console:[0] */

import Service from '../service';

// A simple log service
export default class extends Service {
  constructor(name = 'logger') {
    super(name);
  }
  log(...args) {
    let type = args.unshift();

    if('function' === this[type]) {
      console[type].apply(console, args);
    } else {
      console.log.apply(console, arguments);
    }
  }
  info() {
    console.info.apply(console, arguments);
  }
  debug() {
    console.debug.apply(console, arguments);
  }
  error() {
    console.error.apply(console, arguments);
  }
}
