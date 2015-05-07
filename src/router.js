'use strict';

export default class Router {
    constructor(config, parent) {
      this.config = config;
      this.services = new Map();
      this.sources = new Map();
      this.destinations = new Map();
      this.whooks = [];
      this.mounted = false;
    }
    service(name, service) {
      this.services.set(name, service);
    }
    source(name, source) {
      this.sources.set(name, source);
    }
    destination(name, destination) {
      this.destinations.set(name, destination);
    }
    add(spec, whook) {
      this.push({spec, whook});
    }
    callback() {
      if(this.mounted && !this.config.lazymount) {
        throw new Error('E_ALREADY_MOUNTED');
      }
      this.mounted = true;
    }
}
