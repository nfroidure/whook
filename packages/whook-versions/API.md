# API
## Functions

<dl>
<dt><a href="#augmentAPIWithVersionsHeaders">augmentAPIWithVersionsHeaders(API, VERSIONS)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Augment an OpenAPI with versions headers added.</p>
</dd>
<dt><a href="#initWrapRouteHandlerWithVersionChecker">initWrapRouteHandlerWithVersionChecker(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap a route handler to append CORS to response.</p>
</dd>
</dl>

<a name="augmentAPIWithVersionsHeaders"></a>

## augmentAPIWithVersionsHeaders(API, VERSIONS) ⇒ <code>Promise.&lt;Object&gt;</code>
Augment an OpenAPI with versions headers added.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - The augmented  OpenAPI object  

| Param | Type | Description |
| --- | --- | --- |
| API | <code>Object</code> | The OpenAPI object |
| VERSIONS | <code>Object</code> | The versions configurations |

<a name="initWrapRouteHandlerWithVersionChecker"></a>

## initWrapRouteHandlerWithVersionChecker(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap a route handler to append CORS to response.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services ENV depends on |
| services.VERSIONS | <code>Object</code> |  | A VERSIONS object with the versions configuration |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

