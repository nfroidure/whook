'use strict';

import {
  instanciatePlugs,
  mapAndInstanciate,
  getInvolvedPlugsNameFromSpecs,
  mapPlugs,
  getPlugsMapping
} from './utils';
import YError from 'yerror';
import debug from 'debug';
import Stream from 'stream';

let log = debug('whook.router');

export const WHOOK_SYMBOL = Symbol('WhooksSymbol');

function _buildTreeNode() {
  let node = {};
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
    this.whooksTree = _buildTreeNode();
    this._whookMounts = [];
    this._whooksCache = new Map();
    this._mounted = false;
  }
  service(name, service) {
    this._checkMounted();
    this.services.set(name, service);
    log('Registering service:', name);
    return this;
  }
  source(name, source) {
    this._checkMounted();
    this.sources.set(name, source);
    log('Registering source:', name);
    return this;
  }
  destination(name, destination) {
    this._checkMounted();
    this.destinations.set(name, destination);
    log('Registering destination:', name);
    return this;
  }
  add(specs, whook) {
    let whookMount = {specs, whook};
    this._checkMounted();
    this._whookMounts.push(whookMount);
    this._whooksCache.set(whookMount, {
      sourceNames: getInvolvedPlugsNameFromSpecs(specs, 'source'),
      destinationNames: getInvolvedPlugsNameFromSpecs(specs, 'destination')
    });
    log('Registering a whook:', whook.constructor.name);
    return this;
  }
  callback() {
    if(!this._whookMounts) {
      throw new Error('E_NOTHING_MOUNTED');
    }
    this._mounted = true;
    log('Mounting the router.');
    return (req, res) => {
      this._handle(req, res);
    };
  }
  _handle(req, res) {
    log('Handling a new request.');
    // Erase default statusCode
    res.statusCode = -1;
    // Get the whooks to complete the incoming message
    let involvedWhookMounts = this._prepareWhooksChain(req);
    log('Found ' + involvedWhookMounts.length + ' whooks for her.');
    // Instantiate plugs (destinations, sources)
    let sourcesMap = instanciatePlugs(
      involvedWhookMounts.reduce((sourceNames, whook) => {
        this._whooksCache.get(whook).sourceNames.forEach((name) => {
          if(-1 === sourceNames.indexOf(name)) {
            sourceNames.push(name);
          }
        });
        return sourceNames;
      }, []).reduce((sourcesMap, name) => {
        sourcesMap.set(name, this.sources.get(name));
        return sourcesMap;
      }, new Map()),
      req
    );
    log(sourcesMap.size + ' sources prepared.');
    let destinationsMap = instanciatePlugs(
      involvedWhookMounts.reduce((destinationNames, whook) => {
        this._whooksCache.get(whook).destinationNames.forEach((name) => {
          if(-1 === destinationNames.indexOf(name)) {
            destinationNames.push(name);
          }
        });
        return destinationNames;
      }, []).reduce((destinationsMap, name) => {
        destinationsMap.set(name, this.destinations.get(name));
        return destinationsMap;
      }, new Map()),
      res
    );
    log(destinationsMap.size + ' destinations prepared.');
    // Prepare contexts
    let contexts = this._prepareContexts(
      involvedWhookMounts,
      sourcesMap,
      destinationsMap,
      this.services
    );
    log('Context objects successfully prepared.', contexts);
    // execute pre
    this._runNextWhookMount(involvedWhookMounts, 'pre', 0, contexts)
    // if err stop executing pre, execute preError
      .catch((err) => {
        log('Got an error on the "pre" hook', err.stack);
        return this._runNextWhookMount(involvedWhookMounts, 'preError', 0, contexts, err);
      })
    // process streams
      .then(() => {
        let incomingStream = new Stream.PassThrough();
        let pipeline = incomingStream;
        return new Promise((resolve, reject) => {
          // create the pipeline
          pipeline = this._prepareWhooksPipeline(involvedWhookMounts, contexts, pipeline);
          // flush destination headers
          involvedWhookMounts.forEach((whookMount, index) => {
            this._applyWhookOutput(whookMount, destinationsMap, contexts[index]);
          });
          for(var [name, destination] of destinationsMap) {
            destination.finish();
          }
          if(-1 === res.statusCode) {
            log('No status code were set, fallbacking to 404!');
            res.statusCode = 404;
          }
          // run piped step
          this._runNextWhookMount(
            involvedWhookMounts, 'piped', 0, contexts
          ).then(function() {
            // pipe
            req
              .on('error', (err) => {
                log('Request stream errored.', err);
                reject(err);
              })
              .on('end', () => {
                log('Request stream successfully ended.');
              })
              .pipe(incomingStream);
            if(incomingStream === pipeline) {
              log('Request stream unprocessed.');
            }
            pipeline.pipe(res)
              .on('error', (err) => {
                log('Response stream errored.', err);
                reject(err);
              })
              .on('end', function() {
                log('Response stream successfully ended.', contexts);
              })
              .on('finish', function() {
                log('Response stream successfully finished.', contexts);
              })
              .on('ended', resolve);
            });
          });
      })
    // execute post
      .then(() => {
        return this._runNextWhookMount(involvedWhookMounts, 'post', 0, contexts);
      })
    // if err stop executing post, execute postError
      .catch((err) => {
        log('Got an error on the "post" hook', err.stack);
        return this._runNextWhookMount(involvedWhookMounts, 'postError', 0, contexts, err);
      });
  }
  _checkMounted() {
    if(this._mounted) {
      throw new Error('E_ALREADY_MOUNTED');
    }
  }
  _prepareContexts(involvedWhookMounts, sourcesMap, destinationsMap, services) {
    let contexts = [];
    involvedWhookMounts.forEach((whookMount, index) => {
      let context = {
        in: {},
        out: {},
        services: mapPlugs(this.services, whookMount.specs.services)
      };
      this._prepareWhookInput(whookMount, sourcesMap, context);
      contexts[index] = context;
    });
    return contexts;
  }
  _prepareWhookInput(whookMount, sourcesMap, $) {
    (whookMount.specs.in && whookMount.specs.in.properties ?
      Object.keys(whookMount.specs.in.properties) :
      []
    ).forEach(function(propertyName) {
      let property = whookMount.specs.in.properties[propertyName];
      let [source, query] = property.source.split(':');
      let result = sourcesMap.get(source).get(query);
      if(result.length) {
        $.in[propertyName] = result[0];
      } else {
        $.in[propertyName] = '';
      }
    });
  }
  _applyWhookOutput(whookMount, destinationsMap, $) {
    (whookMount.specs.out && whookMount.specs.out.properties ?
      Object.keys(whookMount.specs.out.properties) :
      []
    ).forEach(function(propertyName) {
      let property = whookMount.specs.out.properties[propertyName];
      let [destination, query] = property.destination.split(':');
      if('undefined' !== typeof $.out[propertyName]) {
        destinationsMap.get(destination).set(query, $.out[propertyName]);
      }
    });
  }
  _prepareWhooksChain(req) {
    let nodes = req.url.split('?')[0].split('/').slice(1);
    return this._whookMounts.filter(function(whookMount) {
      return 0 === whookMount.specs.nodes.length || (
        nodes.length >= whookMount.specs.nodes.length &&
        nodes.every(function(node, index) {
          return 'undefined' === typeof whookMount.specs.nodes[index] || (
            whookMount.specs.nodes[index] instanceof RegExp ?
            whookMount.specs.nodes[index].test(node) :
            whookMount.specs.nodes[index] === node
          );
        })
      );
    });
  }
  _prepareWhooksPipeline(involvedWhookMounts, contexts, pipeline) {
    pipeline.on('error', function(err) {
      log('Pipeline stream errored.', err);
      reject(err);
    }).on('end', function() {
      log('Pipeline stream successfully ended.');
    });
    involvedWhookMounts.forEach((whookMount, index) => {
      if(whookMount.whook.process) {
        pipeline = whookMount.whook.process(contexts[index], pipeline);
        if(!pipeline) {
          throw new YError('E_BAD_PROCESS_RETURN', whookMount.whook.name, pipeline);
        }
        pipeline.on('error', function(err) {
          log('Whook stream "' + whookMount.whook.name + '" errored.', err);
          reject(err);
        }).on('end', function() {
          log('Whook stream "' + whookMount.whook.name + '" successfully ended.');
        });
      }
    });
    return pipeline;
  }
  _runNextWhookMount(involvedWhookMounts, step, index, contexts, err) {
    if(!involvedWhookMounts[index]) {
      return Promise.resolve();
    }
    if(!contexts[index]) {
      return Promise.reject(new Error('E_BAD_CONTEXT'));
    }
    return this._runWhook(involvedWhookMounts[index].whook, step, contexts[index], err)
      .then(() => {
        return this._runNextWhookMount(involvedWhookMounts, step, ++index, contexts, err);
      });
  }
  _runWhook(whook, step, $, err) {
    if(!whook[step]) {
      return Promise.resolve();
    }
    return new Promise(function(resolve, reject) {
      // There is no next function, run synchonously
      if(whook[step].length < 2) {
        try {
          whook[step]($, err);
          resolve();
        } catch(err) {
          reject(err);
        }
        return;
      }
      // Otherwise, let's go async ;)
      whook[step]($, function whookNextFunction(err) {
        if(err) {
          reject(err);
        }
        resolve();
      });
    });
  }
}
