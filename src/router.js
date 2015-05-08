'use strict';

export const WHOOK_SYMBOL = Symbol('WhooksSymbol');

function _buildTreeNode() {
  var node = {};
  Object.defineProperty(node, WHOOK_SYMBOL, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: []
  });
  return node;
}

export default class Router {
    constructor(config, parent) {
      this.config = config;
      this.services = new Map();
      this.sources = new Map();
      this.destinations = new Map();
      this.tree = _buildTreeNode();
      this.mounted = false;
    }
    service(name, service) {
      this.services.set(name, service);
      return this;
    }
    source(name, source) {
      this.sources.set(name, source);
      return this;
    }
    destination(name, destination) {
      this.destinations.set(name, destination);
      return this;
    }
    add(spec, whook) {
      var curNode = this.tree;
      if(spec.nodes && spec.nodes.length) {
        spec.nodes.forEach((node, index, {length}) => {
          if(!curNode[node]) {
            curNode[node] = _buildTreeNode();
          }
          curNode = curNode[node];
        });
      }
      curNode[WHOOK_SYMBOL].push({spec, whook});
      return this;
    }
    callback() {
      if(this.mounted && !this.config.lazymount) {
        throw new Error('E_ALREADY_MOUNTED');
      }
      this.mounted = true;
    }
}
