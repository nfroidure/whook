# API
## Functions

<dl>
<dt><a href="#wrapHandlerWithCORS">wrapHandlerWithCORS(initHandler)</a> ⇒ <code>function</code></dt>
<dd><p>Wrap an handler initializer to append CORS to response.</p>
</dd>
<dt><a href="#augmentAPIWithCORS">augmentAPIWithCORS(API)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Augment a Swagger API to also serve OPTIONS methods with
 the CORS added.</p>
</dd>
<dt><a href="#optionsWithCORS">optionsWithCORS(API)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Augment a Swagger API to also serve OPTIONS methods with
 the CORS added.</p>
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
Augment a Swagger API to also serve OPTIONS methods with
 the CORS added.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - The augmented API object  

| Param | Type | Description |
| --- | --- | --- |
| API | <code>Object</code> | The Swager API |

<a name="optionsWithCORS"></a>

## optionsWithCORS(API) ⇒ <code>Promise.&lt;Object&gt;</code>
Augment a Swagger API to also serve OPTIONS methods with
 the CORS added.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - The augmented API object  

| Param | Type | Description |
| --- | --- | --- |
| API | <code>Object</code> | The Swager API |

