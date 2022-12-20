# API
## Functions

<dl>
<dt><a href="#wrapHandlerWithCORS">wrapHandlerWithCORS(initHandler)</a> ⇒ <code>function</code></dt>
<dd><p>Wrap an handler initializer to append CORS to response.</p>
</dd>
<dt><a href="#augmentAPIWithCORS">augmentAPIWithCORS(API)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Augment an OpenAPI to also serve OPTIONS methods with
 the CORS added.</p>
</dd>
<dt><a href="#wrapErrorHandlerForCORS">wrapErrorHandlerForCORS(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap the error handler service as a last chance to add CORS</p>
</dd>
</dl>

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

<a name="wrapErrorHandlerForCORS"></a>

## wrapErrorHandlerForCORS(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap the error handler service as a last chance to add CORS

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services ENV depends on |
| services.NODE_ENV | <code>Object</code> |  | The injected NODE_ENV value to add it to the build env |
| [services.PROXYED_ENV_VARS] | <code>Object</code> | <code>{}</code> | A list of environment variable names to proxy |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

