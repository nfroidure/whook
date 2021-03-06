[//]: # ( )
[//]: # (This file is automatically generated by a `metapak`)
[//]: # (module. Do not change it  except between the)
[//]: # (`content:start/end` flags, your changes would)
[//]: # (be overridden.)
[//]: # ( )
# @whook/cors
> A wrapper to provide CORS support to a Whook server

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/nfroidure/whook/blob/master/packages/whook-cors/LICENSE)
[![NPM version](https://badge.fury.io/js/%40whook%2Fcors.svg)](https://npmjs.org/package/@whook/cors)


[//]: # (::contents:start)

This  [Whook](https://github.com/nfroidure/whook) wrapper provides
 CORS support by adding it to your OpenAPI file and creating the
 handlers that runs the OPTIONS method when you cannot do it at
 the proxy/gateway level.

## Usage

To use this module, simply add it to your `WRAPPERS` service
 (usually in `src/services/WRAPPERS.ts`):
```diff
import { service } from 'knifecycle';
+ import { wrapHandlerWithCors } from '@whook/cors';
import type { WhookWrapper } from '@whook/whook';

export default service(initWrappers, 'WRAPPERS');

async function initWrappers(): Promise<WhookWrapper<any, any>[]> {
-  const WRAPPERS = [];
+  const WRAPPERS = [wrapHandlerWithCors];

  return WRAPPERS;
}
```

And add the CORS config (usually in `src/config/common/config.js`):
```diff
+ import type {
+   CORSConfig,
+   WhookAPIOperationCORSConfig,
+ } from '@whook/cors';

// ...

export type AppConfigs = WhookConfigs &
+  CORSConfig &
  APIConfig;

const CONFIG: AppConfigs = {
  // ...
+   CORS: {
+     'Access-Control-Allow-Origin': '*',
+     'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
+     'Access-Control-Allow-Headers': [
+       'Accept',
+       'Accept-Encoding',
+       'Accept-Language',
+       'Referrer',
+       'Content-Type',
+       'Content-Encoding',
+       'Authorization',
+       'Keep-Alive',
+       'User-Agent',
+     ].join(','),
+   },
};

// Export custom handlers definitions
export type APIHandlerDefinition = WhookAPIHandlerDefinition<
+  WhookAPIOperationCORSConfig &
  WhookAPIOperationSwaggerConfig
>;

export default CONFIG;
```

Finally, you must adapt the API service to handle CORS options:
```diff
+ import { augmentAPIWithCORS } from '@whook/cors';

// (...)

export default name('API', autoService(initAPI));

// The API service is where you put your handlers
// altogether to form the final API
async function initAPI({
// (..)
) {

  // (..)

  // You can apply transformations to your API like
  // here for CORS support (OPTIONS method handling)
-  return augmentAPIWithFakeAuth({ ENV }, API);
+  return augmentAPIWithCORS(await augmentAPIWithFakeAuth({ ENV }, API));
}
```

To see a real example have a look at the
 [`@whook/example`](https://github.com/nfroidure/whook/tree/master/packages/whook-example).

[//]: # (::contents:end)

# API
## Members

<dl>
<dt><a href="#_default">_default</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>A simple Whook handler that just returns a 200 OK
 HTTP response</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#wrapHandlerWithCORS">wrapHandlerWithCORS(initHandler)</a> ⇒ <code>function</code></dt>
<dd><p>Wrap an handler initializer to append CORS to response.</p>
</dd>
<dt><a href="#augmentAPIWithCORS">augmentAPIWithCORS(API)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Augment an OpenAPI to also serve OPTIONS methods with
 the CORS added.</p>
</dd>
</dl>

<a name="_default"></a>

## \_default ⇒ <code>Promise.&lt;Object&gt;</code>
A simple Whook handler that just returns a 200 OK
 HTTP response

**Kind**: global variable  
**Returns**: <code>Promise.&lt;Object&gt;</code> - The HTTP response object  
<a name="wrapHandlerWithCORS"></a>

## wrapHandlerWithCORS(initHandler) ⇒ <code>function</code>
Wrap an handler initializer to append CORS to response.

**Kind**: global function  
**Returns**: <code>function</code> - The handler initializer wrapped  

| Param | Type | Description |
| --- | --- | --- |
| initHandler | <code>function</code> | The handler initializer |

<a name="augmentAPIWithCORS"></a>

## augmentAPIWithCORS(API) ⇒ <code>Promise.&lt;Object&gt;</code>
Augment an OpenAPI to also serve OPTIONS methods with
 the CORS added.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - The augmented  OpenAPI object  

| Param | Type | Description |
| --- | --- | --- |
| API | <code>Object</code> | The OpenAPI object |


# Authors
- [Nicolas Froidure](http://insertafter.com/en/index.html)

# License
[MIT](https://github.com/nfroidure/whook/blob/master/packages/whook-cors/LICENSE)
