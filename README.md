# Whook

> Build strong and efficient REST web services.

**Early call for advice:** Since i want to be sure that this architecture
 doesn't only fit my own needs, here is just a description of what this project
 **could** be. Your input is very welcome.

This project is intended to borrow everything good in every NodeJS framework
 with some additions i'd like to have as a REST web services developper.

I'm till in the API design process. Feel free to add issues, give advice and
 even enters the early dev team if you think this ideas worth a concrete
 implementation.

## Principles: The wireable REST framework

The Whook goal is to tighly couple route definitions with the other parts of
 a REST API definition (query parameters, request/response headers, status
 codes ...).

For that matters  Whook
As a result, a Hook (the Wook logical modules) only process generic requests in
 input and output generic responses:

```js
jsonHook.pre = function($, next()) {
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
 bindings with the various hooks you are using.

```js
myRouter.add({
  in: {
    contentType: {
      source: 'req-headers:Content-Type'
    },
    body: {
      source: 'tmp:body'
    }
  },
  out: {
    content: {
      dest: 'res-body'
    }
  }
}, jsonHook);
```

Hooks are working with abstract requests/responses while the routes are wrapping
 real requests/responses resulting in a flexible and easily testable
 architecture.

The wrapping logic is described using specs allowing strong checking of
 your API's IOs and its automatic documentation generation no matter how many
 modules are used to complete a single API endpoint.

Since hooks do not operate on real requests/responses, your API isn't
 necessarily influenced by them (until you don't use their default specs).

The Whook router is a smart tree based on your API uri nodes leading to
 efficient routing.

Whook embed a few main concepts:
- the [router](#the-router-api) is responsible of selecting wich hooks has to
 be run to complete the request and bring a response. It also manage the context
 in wich a hook should be run according to the specs your provide.
- [hooks](#the-hook-interface) are sort of middlewares/controllers but with
 finest settings and working with abstracted request/responses/services.
- the [context](#the-context-object) is a custom object given to hooks by the
 router (often named `$`). It is a proxy beetween request/response properties
 (headers, query parameters, uri, methods etc...) and hooks.
- [specs](#the-specs-format) are rules defining how the router should deal with
 hooks input and output.
- [services](#services) are objects/functions you may find useful to work with
 in your hooks and injected per the router into them according to your specs.


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

### Hook.specs

Default specs may be exposed as a static property. It is useful to declare
 default specs a user could take as is to declare routes quickly:
```js
var router = new Router();
var MyHook = require('myhook');

router.hook(MyHook.specs, MyHook);
```

### Hook.prototype.init($:Object, next:Function)

Called to initialize the hook with the parsed params from request headers,
 the query string, the uri and the router configuration. Any values can be
 registered through the `$` object given in argument. Mainly used to
 apply changes to `$.req` with default values.

The `next` callback optionnaly accepts an error.

### Hook.prototype.pre($:Object, next:Function)
Called just before starting to send the response (last chance to set values in
 `$.res`). The request content is available as a stream in the context object
 (`$.reqStream`), you may decide to consume it or not depending on your needs.

The `next` callback optionnaly accepts an error.

### Hook.prototype.preError(err:Error, $:Object, next:Function)
Called just before starting to send the response if any error happened earlyer.
 Allows you to change the response metadata according to that error.

### Hook.prototype.process($:Object)

Last chance to consume `$.reqStream`. Set output as a stream to `$.resStream`.
 Applying changes to `$.res` has no effect anymore.

### Hook.prototype.piped($:Object)

Called when the whole pipeline is finaly piped to the response. Last chance to
 pipe `$.resStream` to another destination. Applying changes to `$.res` has no
 effect.

### Hook.prototype.post($:Object, next:Function)

Called after the response was sent (ie, the response stream ended). Useful to
 create web hooks, log things or anything else.

The `next` callback optionnaly accepts an error.

### Hook.prototype.postError(err:Error, $:Object, next:Function)

Called when something went wrong **after** the response was sent. You no longer
 can warn the API client.

### Sample hooks

#### Time Hook

A hook that give you the current time of the server.

```js
var stringToStream = require('string-to-stream');

function TimeHook() {}

// Default wrap specs
TimeHook.specs = {
  methods: ['GET'], // Apply to GET requests only
  nodes: ['time'], // Hook wil be mounted to /time API endpoint
  req: {
    format: {
      source: 'qs:format', // value will be picked in query parameters (?format)
      type: String,
      default: 'timestamp',
      enum: ['timestamp', 'iso'],
      description: 'Whether the download header should be added or not.'
    }
  },
  res: {
    status: {
      type: Number,
      required: true,
      destination: 'status',
    },
    contentType: {
      type: String,
      required: true,
      destination: 'headers:Content-Type',
    }
  }
};

// Logic applyed to response/request abstract data before sending response content
TimeHook.prototype.pre = function($) {
  $.res.contentType = 'text/plain';
});

// Logic applyed to response/request abstract data before sending response content
TimeHook.prototype.process = function($) {
  $.resStream = stringToStream(
    (new Date())['iso' === $.req.format ? 'toISOString' : 'getTime']()
  );
});

```


#### Download Hook

A Hook adding download flags to specify that a browser should download the
 request content and prompt users to save it on their disk.

```js
function DownloadWhook() {}

// Default wrap specs
DownloadWhook.specs = {
  methods: ['GET'],
  req: {
    download: {
      source: 'qs:download',
      type: Boolean,
      default: false,
      description: 'Whether the download header should be added or not.'
    },
    filename: {
      source: 'shares:filename', // get filename from shared context
      type: String,
      default: '',
      description: 'The filename under wich the download should be saved.'
    }
  },
  res: {
    contentDisposition: {
      destination: 'headers:Content-Disposition',
      type: String
    }
  }
};

// Logic applyed to the response depending on the request
DownloadWhook.prototype.pre = function($) {
  if($.req.download) {
    $.res.contentDisposition = 'attachment' +
      ($.req.filename ? '; filename="' + $.req.filename + '"');
  }
});
```

## The Router API

The router allows you to mount a hook to your web service by mapping its
 params with your API.

Using specs allows you to automatically generate your API documentation while
 still being able to use third party middlewares.

### Router constructor(config:Object)

Creates a new Whook router with the given configuration.

### Router.prototype.service(name:String, service:Object)

Register a service to be attached to `$.services`.

### Router.prototype.source(name:String, source:Function)

Register a new source for `$.req` mapping. The `source` function signature
 `function(query) { return value; }`.

### Router.prototype.dest(name:String, dest:Function)

Register a new destination for `$.res` mapping. The `dest` function signature
 `function(path, value) { }`.

### Router.prototype.callback()

Callbacks to mount the router to an HTTP server. Note you can mount a router to
 several servers.

```js
var router = new Router();
var http = require('http');
http.createServer(router.callback()).listen(3000);
http.createServer(router.callback()).listen(3001);
```

You can that way mount the router to an existing Express/Connect server.

### childRouter:Router Router.add(specs:Object, hook:Hook)

Mount the route driven by `hook` according to the given `specs` and
 returns `childRouter` to allows you to create sub routes. If methods were
 declared, then you can only use a subset of those methods.

```js
// Creating the router
var router = new Router({
  domain: 'api.example.com',
  ip: '0.0.0.0',
  port: 80
});

// Adding global configuration
router.add({
  methods: ['OPTIONS', 'GET', 'PUT', 'PATCH', 'POST', 'DELETE'],
  req: {
    method: {
      source: 'method',
      type: String,
      required: true,
    },
    domain: {
      source: 'config',
      type: String,
      required: true,
      description: 'Application domain name.'
    }
  }
});

// Creating the v1 endpoint
var v1Router = router.add({
  nodes: ['api', 'v1']
  req: {
    version: {
      name: 'version',
      source: 'nodes:1', // Takes the second node value
      type: String,
      required: true,
      description: 'API version.'
    }
  }
});


// Sample of a GET /api/v1/users/:id route declaration
v1Router.add({
  methods: ['GET']
  nodes: [
    'users',
    /^(a-f0-9){24}$/
  ],
  in: {
    id: {
      source: 'qs:id',
      type: ObjectId,
      required: true,
      description: 'The id of the user you wish to access to.'
    }
  }
}, UserHook);
```

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

Asimple key:value object mapping for services names:
```js
{
  connection: 'db', // map the 'db' service to the 'connection' for this Whook
  logger: 'winston' // map the 'winston' service to the 'logger' for this Whook
}
```

## The context object

The context object (alias `$`) is built specifically for each Whook instance
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

