# Whook

> Build strong and efficient REST web services.

This project is intended to borrow everything good in every NodeJS framework
 with some additions i'd like to have as a REST web services developper.

I'm till in the API design process. Feel free to add issues, give advice and
 even enters the early dev team if you think this ideas worth a production
 level implementation.

The first stable version will be [1.0.0](https://github.com/nfroidure/whook/milestones/1.0.0),
use prior versions a your own risk ;).

## Usage

```js
import whook from 'whook';
import TimeWhook from 'whook/dist/whooks/time';
import http from 'http';

let router = whook();
let server;

// Return current timestamp for GET /time requests
router.add(TimeWhook.specs(), new TimeWhook('time'));

server = http.createServer(router.callback());
server.listen(1337);
```

## Principles: The pluggable REST framework

Creating REST APIs with Whook is mainly about building your API by plugin
 logic in it. Whook allows you to do it well with
 [a negligible performance trade-off](https://github.com/nfroidure/whook-perf)
 comparing to frameworks like ExpressJS or Koa.

The Whook goal is to tighly couple route definitions with the other parts of
 a REST API definition (query parameters, request/response headers, status
 codes ...).

As a result, a Hook (the Wook logical modules) only process generic requests in
 input and output generic responses:

```js
jsonHook.pre = function($, next) {
  if('application/json' === $.in.contentType) {
    try {
      $.out.content = JSON.stringify($.in.body);
      next();
    } catch(err) {
      next(err);
    }
  }
};
```

On the other hand, the Whook router requires you to define your API and the
 bindings with the various hooks you are using. This is done with the help of
 specs:

```js
// Adding a hook to handle JSON
router.add({
  in: { // What goes in your hook
    $schema: 'http://json-schema.org/draft-04/schema#',
    title: 'Input',
    type: 'object',
    properties: {
      contentType: {
        source: 'headers:Content-Type',
        type: 'string',
        default: false,
        description: 'Whether the request body content type.'
      },
      body: {
        source: 'mem:body',
        type: 'object',
        required: true,
        description: 'The request body as an object.'
      }
    }
  },
  out: { // What your hook output
    $schema: 'http://json-schema.org/draft-04/schema#',
    title: 'Output',
    type: 'object',
    properties: {
      contentDisposition: {
        destination: 'headers:Content-Disposition',
        type: 'string'
      }
    }
  },
  services: { // Services your hook may need
    log: ''
  }
}, jsonHook); // The hook logic
```

Hooks are working with abstract requests/responses while the routes are wrapping
 real requests/responses resulting in a flexible and easily testable
 architecture.

The wrapping logic is described using specs allowing strong checking of
 your API's IOs (with the help of JSON Schema) and its automatic documentation
 generation no matter how many modules are used to complete a single API endpoint.

Since hooks do not operate on real requests/responses, your API isn't
 necessarily influenced by them. But if it suits you well, you can use the whook
 default specs, in this case, your route definition becomes tinyer:
 ```js
 router.add(JSONHook.specs(), new JSONHook());
 ```

The Whook router is a smart tree based on your API uri nodes leading to
 efficient routing.

Whook embed a few main concepts:
- the [router](#the-router-api) is responsible of selecting which hooks has to
 be run to complete the request and bring a response. It also manages the context
 in which a hook should be run according to the specs you provide.
- [hooks](#the-hook-interface) are sort of middlewares/controllers but with
 finest settings and working with abstracted requests/responses/services.
- [context](#the-context-object) is a custom object given to whooks by the
 router (often named `$`). It is a lazy proxy between request/response
 properties (headers, query parameters, uri, methods etc...) and whooks.
- [specs](#the-specs-format) are rules defining how the router should deal with
 hooks input and output.
- [services](#services) are resources you want hooks to be able to work with.
 They are injected per the router into them according to given specs.


## The hook interface

In order to be mounted to a route, a hook should implement at least one
 of the hooking methods to be useful. A hook is sort of an Express/Connect
 middleware on steroids.

You may also want to rely on higher level hooks like ObjectHook to
 threat HTTP contents like a single object, ObjectsCollectionHook to work
 with an array of objects or ObjectsStreamHook for a stream of objects.

You can also create you own abstraction for your own needs. Finally, you may
 want to wrap existing Connect/Express middlewares with the MiddlewareHook.

Hooks code is based on a simple assumption: "You don't want to know a
 thing about requests/responses format". You just want some input and provide
 output.

### Hook constructor()

A hook need to be a concrete class. Do anything you want there.

### Hook.specs()

Default specs may be exposed as a static method. It is useful to declare
 default specs a user could take as is to declare routes quickly:
```js
import myhook from 'myhook';
import whook from 'whook';

let router = whook();
router.add(MyHook.specs(), MyHook);
```

### Hook.prototype.init($:Object, next:Function)

Called to initialize the hook with the parsed parameters from request headers,
 the query string, the uri and the router configuration. Any values can be
 registered through the `$` object given in argument. Mainly used to
 apply changes to `$.req` with default values.

The `next` callback optionally accepts an error.

### Hook.prototype.pre($:Object, next:Function)
Called just before starting to send the response (last chance to set values in
 `$.res`). The request content is available as a stream in the context object
 (`$.reqStream`), you may decide to consume it or not depending on your needs.

The `next` callback optionally accepts an error.

### Hook.prototype.preError(err:Error, $:Object, next:Function)
Called just before starting to send the response if any error happened earlyer.
 Allows you to change the response metadata according to that error.

### Hook.prototype.process($:Object)

Last chance to consume `$.reqStream`. Set output as a stream to `$.resStream`.
 Applying changes to `$.res` has no effect anymore.

### Hook.prototype.piped($:Object)

Called when the whole pipeline is finally piped to the response. Last chance to
 pipe `$.resStream` to another destination. Applying changes to `$.res` has no
 effect.

### Hook.prototype.post($:Object, next:Function)

Called after the response was sent (ie, the response stream ended). Useful to
 create web hooks, log things or anything else.

The `next` callback optionally accepts an error.

### Hook.prototype.postError(err:Error, $:Object, next:Function)

Called when something went wrong **after** the response was sent. You no longer
 can warn the API client.

### Sample hooks

This repository will probably not contain hooks (except the Hooks base class).
 But in order to illustrate how it could look like, some sample hooks are
 currently embedded:

- **TimeHook:** A hook that give you the current time of the server -
 [source](https://github.com/nfroidure/whook/blob/master/src/whooks/time.js) -
 [tests](https://github.com/nfroidure/whook/blob/master/src/whooks/time.mocha.js)
- **DownloadHook:** A Hook adding download flags to specify that a browser
  should download the request content and prompt users to save it on their
  disk. -
 [source](https://github.com/nfroidure/whook/blob/master/src/whooks/download.js) -
 [tests](https://github.com/nfroidure/whook/blob/master/src/whooks/download.mocha.js)

## The Router API

The router allows you to mount a hook to your web service by mapping its
 parameters with your API.

Using specs allows you to automatically generate your API documentation while
 still being able to use third party middlewares.

### Router constructor(config:Object)

Creates a new Whook router with the given configuration.

### Router.prototype.service(name:String, service:Object)

Register a service to be attached to `$.services`.

### Router.prototype.source(name:String, source:Function)

Register a new source for `$.req` mapping. The `source` () => signature
 `function(query) { return value; }`.

### Router.prototype.dest(name:String, dest:Function)

Register a new destination for `$.res` mapping. The `dest` () => signature
 `function(path, value) { }`.

### Router.prototype.callback()

Callbacks to mount the router to an HTTP server. Note you can mount a router to
 several servers.

```js
import http from 'http';
import Router from 'whook/src/router';

let router = new Router();

http.createServer(router.callback()).listen(3000);
http.createServer(router.callback()).listen(3001);
```

You can that way mount the router to an existing Express/Connect server.

### childRouter:Router Router.add(specs:Object, hook:Hook)

Mount the route driven by `hook` according to the given `specs` and
 returns `childRouter` to allows you to create sub routes. If methods were
 declared, then you can only use a subset of those methods.

## The Specs format

Specs are injected in the router for each whook mount. Specs allow to build
 the context object passed to whooks according to your wills.

### specs.methods

An array of methods supported by the whook.

### specs.nodes

URI nodes at which the router mount the whook.

### specs.in

An object describing how to build hooks input based on the given rules. Rules looks like this:

```js
{
  $schema: 'http://json-schema.org/draft-04/schema#', see // http://json-schema.org/
  title: 'Input',
  type: 'object',
  properties: {
    prop: { // the property in wich the value will be set (here: $.in.prop)
      source: 'qs:download', // the source in wich to lookup and the associated query
      type: 'boolean', // the type of the value (see http://json-schema.org/latest/json-schema-core.html#anchor8)
      default: false, // Default value for the property
      description: 'Text describing prop!' // a useful description
    }
  }
}
```


Sources can be one of the default sources (config, shares, qs, headers) or any
 other source declared with `Router.source()`.

### specs.out

An object describing what to do with the `$.out` contents. Rules look like this:

```js
{
  $schema: 'http://json-schema.org/draft-04/schema#', see // http://json-schema.org/
  title: 'Output',
  type: 'object',
  properties: {
    prop: { // the property from wich the value will be read (here: $.in.prop)
      dest: 'dest:path', // the destination of the value and the associated path
      type: 'boolean', // the type of the value (see http://json-schema.org/latest/json-schema-core.html#anchor8)
      default: false, // Default value for the property
      type: 'string', // the type of the value (provide a cast constructor)
      required: true, // True if the value must exist
      default: '', // Default value for the property
      description: 'Text describing prop!' // a useful description
    }
  }
}
```

Destinations can be one of the native destinations (headers, status, shares) or
 any other destination declared with `Router.dest()`.

### specs.services

A simple service declaration of injected services with a simple key:value object
 mapping:
```js
{
  log: '' //  inject 'log' for this Whook
  connection: 'db', // inject the 'db' service as 'connection' for this Whook
}
```

**Warning:** Services are not mixins! If you want to share code between Whooks,
 use the module system. Services are only intended to provide access to
 resources.

## The context object

The context object (alias `$`) is built specifically for each Hook instance
 (and consequently for each client request) from specs given at mount on the
 router.


Its `in` and `out` properties are pure primitive data. It should always
 be serializable with JSON. While Whook won't impeach you to add logic in, it is
 strongly discouraged. If you need cross hooks logic, use composition instead.
 If you need cross hooks data access use services.

Here are the different properties you may find in a context object.

## $.in

Contains values mapped from real requests according to the `in` specs given to
 the router. Changing their values has no effect elsewhere than in the current
 hook.

Debug:
- set the 'whook.in.notfound' to know when a value isn't found.
- set the 'whook.in.verbose' flag to get infos on what's going on with request
 specs matching.

## $.out

Empty object from which values will be mapped to real responses according to the
 specs given to the router. The last hook has the last word.

Debug:
- set the 'whook.out.overrides' flag to get warnings when a response value is overriden.
- set the 'whook.out.unused' flag to know when a hook value is not used.

## $.services

Services registered in the router you may need to use (typically, loggers,
 databases, external web services, mailers etc...). Their name will be the one
 defined in the `Router.service()` registration or, eventually, the one mapped
 from specs.

Debug:
- set the 'whook.services.notfound' flag to be warn when specified service is not found.
