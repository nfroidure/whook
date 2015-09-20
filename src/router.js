import {
  instanciatePlugs,
  getInvolvedPlugsNameFromSpecs,
  mapPlugs,
} from './utils';
import YError from 'yerror';
import debug from 'debug';
import Stream from 'stream';
import Ajv from 'ajv';

let log = debug('whook.router');
let ajv = new Ajv();

export default class Router {
  constructor(config) {
    this.config = config;
    this.services = new Map();
    this.sources = new Map();
    this.destinations = new Map();
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
    let whookMount = { specs, whook };

    log('Registering a whook:', whook.constructor.name);
    this._checkMounted();
    this._whookMounts.push(whookMount);
    this._whooksCache.set(whookMount, {
      inValidate: ajv.compile(specs.in || {}),
      outValidate: ajv.compile(specs.in || {}),
      sourceNames: getInvolvedPlugsNameFromSpecs(specs, 'source'),
      destinationNames: getInvolvedPlugsNameFromSpecs(specs, 'destination'),
    });
    whook.init(specs);
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
    let involvedWhookMounts;
    let sourcesMap;
    let destinationsMap;
    let contexts;

    log('Handling a new request.');

    // Erase default statusCode
    res.statusCode = -1;

    // Get the whooks to complete the incoming message
    involvedWhookMounts = this._getInvolvedWhooksMount(req);

    // Instantiate plugs (destinations, sources)
    sourcesMap = instanciatePlugs(
      this._getPlugsMapFromWhookMounts(involvedWhookMounts, 'source'),
      req
    );
    destinationsMap = instanciatePlugs(
      this._getPlugsMapFromWhookMounts(involvedWhookMounts, 'destination'),
      res
    );

    // Prepare contexts
    contexts = this._prepareContexts(
      involvedWhookMounts,
      sourcesMap,
      destinationsMap,
      this.services
    );
    log('Context objects successfully prepared.', contexts);

    // Check input
    this._validateWhooksInput(involvedWhookMounts, contexts)
      // execute pre when no error
      .then(this._runNextWhookMount.bind(this, involvedWhookMounts, 'pre', 0, contexts))
      // Check output
      .then(this._validateWhooksOutput(involvedWhookMounts, contexts))
      // if err stop/avoid executing pre, execute preError
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
          // flush destinations
          involvedWhookMounts.forEach((whookMount, index) => {
            this._applyWhookOutput(whookMount, destinationsMap, contexts[index]);
          });
          for(let [name, destination] of destinationsMap) {
            destination.finish();
          }
          if(-1 === res.statusCode) {
            log('No status code were set, fallbacking to 404!');
            res.statusCode = 404;
          }
          // run piped step
          this._runNextWhookMount(
            involvedWhookMounts, 'piped', 0, contexts
          ).then(() => {
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
              .on('end', () => {
                log('Response stream successfully ended.', contexts);
              })
              .on('finish', () => {
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
  _getPlugsMapFromWhookMounts(whookMounts, plugType) {
    var plugsMap = whookMounts.reduce((plugNames, whookMount) => {
      log('Looking for "' + whookMount.whook.name + '" whook mount in the cache.');
      this._whooksCache.get(whookMount)[plugType + 'Names'].forEach((name) => {
        if(-1 === plugNames.indexOf(name)) {
          plugNames.push(name);
        }
      });
      return plugNames;
    }, []).reduce((plugsMap, name) => {
      var plug = this[plugType + 's'].get(name);

      if(!plug) {
        // Maybe check this in router.add ?
        throw new YError('E_UNKNOW_' + plugType.toUpperCase(), name);
      }
      plugsMap.set(name, plug);
      return plugsMap;
    }, new Map());

    log(plugsMap.size + ' ' + plugType + 's prepared.');
    return plugsMap;
  }
  _prepareContexts(involvedWhookMounts, sourcesMap) {
    let contexts = [];

    involvedWhookMounts.forEach((whookMount, index) => {
      let context = {
        in: {},
        out: {},
        services: mapPlugs(this.services, whookMount.specs.services),
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
    ).forEach((propertyName) => {
      let property = whookMount.specs.in.properties[propertyName];
      let [source, query] = property.source.split(':');
      let results = sourcesMap.get(source).get(query);

      if(results.length) {
        $.in[propertyName] = results[0];
      } else if('undefined' !== typeof property.default) {
        $.in[propertyName] = property.default;
      }
    });
  }
  _validateWhooksInput(whookMounts, contexts) {
    var errors = whookMounts.reduce((errors, whookMount, i) => {
      var validate = this._whooksCache.get(whookMount).inValidate;

      if(!validate(contexts[i].in || {})) {
        errors = errors.concat(validate.errors);
      }
      return errors;
    }, []);

    if(errors.length) {
      log('Found errors in input.', errors);
      return Promise.reject(new YError('E_BAD_INPUT', errors));
    }
    return Promise.resolve();
  }
  _applyWhookOutput(whookMount, destinationsMap, $) {
    (whookMount.specs.out && whookMount.specs.out.properties ?
      Object.keys(whookMount.specs.out.properties) :
      []
    ).forEach((propertyName) => {
      let property = whookMount.specs.out.properties[propertyName];
      let [destination, query] = property.destination.split(':');

      if('undefined' !== typeof $.out[propertyName]) {
        destinationsMap.get(destination).set(query, $.out[propertyName]);
      }
    });
  }
  _validateWhooksOutput(whookMounts, contexts) {
    var errors = whookMounts.reduce((errors, whookMount, i) => {
      var validate = this._whooksCache.get(whookMount).outValidate;

      if(!validate(contexts[i].out || {})) {
        errors = errors.concat(validate.errors);
      }
      return errors;
    }, []);
    log('Validating outputs:', contexts);

    if(errors.length) {
      log('Found errors in output.', errors);
      return Promise.reject(new YError('E_BAD_INPUT', errors));
    }
    return Promise.resolve();
  }
  _getInvolvedWhooksMount(req) {
    let nodes = req.url.split('?')[0].split('/').slice(1);
    let involvedWhookMounts = this._whookMounts.filter((whookMount) => {
      return 0 === whookMount.specs.nodes.length || (
        nodes.length >= whookMount.specs.nodes.length &&
        nodes.every((node, index) => {
          return 'undefined' === typeof whookMount.specs.nodes[index] || (
            whookMount.specs.nodes[index] instanceof RegExp ?
            whookMount.specs.nodes[index].test(node) :
            whookMount.specs.nodes[index] === node
          );
        })
      );
    });

    log('Found ' + involvedWhookMounts.length + ' whooks for her.');

    return involvedWhookMounts;
  }
  _prepareWhooksPipeline(involvedWhookMounts, contexts, pipeline, reject) {
    pipeline.on('error', (err) => {
      log('Pipeline stream errored.', err);
      reject(err);
    }).on('end', () => {
      log('Pipeline stream successfully ended.');
    });
    involvedWhookMounts.forEach((whookMount, index) => {
      var newPipeline;

      if(!whookMount.whook.process) {
        return;
      }
      newPipeline = whookMount.whook.process(contexts[index], pipeline);
      if(!newPipeline) {
        log('Process returned no stream:', whookMount.whook.name);
        newPipeline = new Stream.PassThrough();
        setImmediate(newPipeline.end.bind(newPipeline));
        return;
      }
      pipeline = newPipeline;
      pipeline.on('error', (err) => {
        log('Whook stream "' + whookMount.whook.name + '" errored.', err);
        reject(err);
      }).on('end', () => {
        log('Whook stream "' + whookMount.whook.name + '" successfully ended.');
      });
    });
    return pipeline;
  }
  _runNextWhookMount(involvedWhookMounts, step, index, contexts, err) {
    if(!involvedWhookMounts[index]) {
      return Promise.resolve();
    }
    if(!contexts[index]) {
      return Promise.reject(new YError('E_BAD_CONTEXT', index));
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
    return new Promise(function whookPromiseFunction(resolve, reject) {
      // There is no next function, run synchonously
      if((err ? 3 : 2) > whook[step].length) {
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
      }, err);
    });
  }
}
