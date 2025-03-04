[//]: # ( )
[//]: # (This file is automatically generated by a `metapak`)
[//]: # (module. Do not change it  except between the)
[//]: # (`content:start/end` flags, your changes would)
[//]: # (be overridden.)
[//]: # ( )
# @whook/cors
> A wrapper to provide CORS support to a Whook server

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/nfroidure/whook/blob/main/packages/whook-cors/LICENSE)


[//]: # (::contents:start)

This [Whook](https://github.com/nfroidure/whook) wrapper provides CORS support
by adding it to your OpenAPI file and creating the handlers that runs the
OPTIONS method when you cannot do it at the proxy/gateway level.

## Usage

To use this plugin, simply install it:

```sh
npm i @whook/cors;
```

Declare it in the `src/index.ts` file of your project:

```diff

  // ...

  $.register(
    constant('HANDLERS_WRAPPERS', [
+      'wrapHandlerWithCORS',
      'wrapHandlerWithAuthorization',
    ]),
  );

  // ...

  $.register(
    constant('WHOOK_PLUGINS', [
      ...WHOOK_DEFAULT_PLUGINS,
+      '@whook/cors',
      '@whook/authorization',
    ]),
  );

  // ...
```

Declare types in your `src/whook.d.ts` definition:

```diff
+ import {
+   type CORSConfig,
+   type WhookAPIOperationCORSConfig,
+ } from '@whook/cors';

declare module 'application-services' {

  // ...

  export interface AppConfig
-    extends WhookBaseConfigs {}
+    extends WhookBaseConfigs, CORSConfig {}

  // ...
}

// ...

declare module '@whook/whook' {
  export interface WhookAPIHandlerDefinition<
    T extends Record<string, unknown> = Record<string, unknown>,
    U extends {
      [K in keyof U]: K extends `x-${string}` ? Record<string, unknown> : never;
    } = unknown,
    V extends Record<string, unknown> = Record<string, unknown>,
  > extends WhookBaseAPIHandlerDefinition<T, U> {
    operation: U & WhookAPIOperation<
        T &
      WhookAPIOperationSwaggerConfig & WhookAPIOperationCORSConfig
    >;
  }
}
```

And add the CORS config (usually in `src/config/common/config.js`):

```diff
// ...
import { type AppConfig } from 'application-services';

const CONFIG: AppConfig = {
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

export default CONFIG;
```

You should also use the wrapped error handler:

```diff
+ import { initErrorHandlerWithCORS } from '@whook/cors';

// ...

export async function prepareEnvironment<T extends Knifecycle<Dependencies>>(
    $: T = new Knifecycle() as T,
  ): Promise<T> {

//...

+  // Add the CORS wrapped error handler
+  $.register(initErrorHandlerWithCORS);

  return $;
}
```

According to the kind of build you use, you may also declare it in your
`src/build.ts` file:

```diff
  $.register(
    constant('INITIALIZER_PATH_MAP', {
      ...DEFAULT_BUILD_INITIALIZER_PATH_MAP,
      // MY_SERVICE: '@my/service_module_name',
      jwtToken: 'jwt-service/dist/index.js',
+      errorHandler: '@whook/cors/dist/services/errorHandler.js',
    }),
  );
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

Note that you can define individual CORS values on the handler definitions usins
the `x-whook` property.

[//]: # (::contents:end)

# API
## Functions

<dl>
<dt><a href="#augmentAPIWithCORS">augmentAPIWithCORS(API)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Augment an OpenAPI to also serve OPTIONS methods with
 the CORS added.</p>
</dd>
<dt><a href="#wrapErrorHandlerForCORS">wrapErrorHandlerForCORS(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap the error handler service as a last chance to add CORS</p>
</dd>
<dt><a href="#initWrapHandlerWithCORS">initWrapHandlerWithCORS(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap an handler to append CORS to response.</p>
</dd>
</dl>

<a name="augmentAPIWithCORS"></a>

## augmentAPIWithCORS(API) ⇒ <code>Promise.&lt;Object&gt;</code>
Augment an OpenAPI to also serve OPTIONS methods with
 the CORS added.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - The augmented  OpenAPI object  

| Param | Type | Description |
| --- | --- | --- |
| API | <code>Object</code> | The OpenAPI object |

<a name="wrapErrorHandlerForCORS"></a>

## wrapErrorHandlerForCORS(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap the error handler service as a last chance to add CORS

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services depended on |
| services.CORS | <code>Object</code> |  | A CORS object to be added to errors responses |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initWrapHandlerWithCORS"></a>

## initWrapHandlerWithCORS(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to append CORS to response.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services ENV depends on |
| services.CORS | <code>Object</code> |  | A CORS object to be added to errors responses |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |


# Authors
- [Nicolas Froidure](http://insertafter.com/en/index.html)

# License
[MIT](https://github.com/nfroidure/whook/blob/main/packages/whook-cors/LICENSE)
