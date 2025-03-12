# API
## Functions

<dl>
<dt><a href="#augmentAPIWithCORS">augmentAPIWithCORS(API)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Augment an OpenAPI to also serve OPTIONS methods with
 the CORS added.</p>
</dd>
<dt><a href="#initOptionsWithCORS">initOptionsWithCORS()</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>A simple Whook handler that just returns a 200 OK
 HTTP response</p>
</dd>
<dt><a href="#wrapErrorHandlerForCORS">wrapErrorHandlerForCORS(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap the error handler service as a last chance to add CORS</p>
</dd>
<dt><a href="#initWrapRouteHandlerWithCORS">initWrapRouteHandlerWithCORS(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap a route handler to append CORS to response.</p>
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

<a name="initOptionsWithCORS"></a>

## initOptionsWithCORS() ⇒ <code>Promise.&lt;Object&gt;</code>
A simple Whook handler that just returns a 200 OK
 HTTP response

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - The HTTP response object  
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

<a name="initWrapRouteHandlerWithCORS"></a>

## initWrapRouteHandlerWithCORS(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap a route handler to append CORS to response.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services ENV depends on |
| services.CORS | <code>Object</code> |  | A CORS object to be added to errors responses |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

