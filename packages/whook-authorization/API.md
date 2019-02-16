# API
## Constants

<dl>
<dt><a href="#optionsWithCORS">optionsWithCORS</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
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

<a name="optionsWithCORS"></a>

## optionsWithCORS ⇒ <code>Promise.&lt;Object&gt;</code>
A simple Whook handler that just returns a 200 OK
 HTTP response

**Kind**: global constant  
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

