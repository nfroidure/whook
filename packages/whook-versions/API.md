# API
## Functions

<dl>
<dt><a href="#wrapHandlerWithVersionChecker">wrapHandlerWithVersionChecker(initHandler)</a> ⇒ <code>function</code></dt>
<dd><p>Wrap an handler initializer to check versions headers.</p>
</dd>
<dt><a href="#augmentAPIWithVersionsHeaders">augmentAPIWithVersionsHeaders(API, VERSIONS)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Augment an OpenAPI with versions headers added.</p>
</dd>
</dl>

<a name="wrapHandlerWithVersionChecker"></a>

## wrapHandlerWithVersionChecker(initHandler) ⇒ <code>function</code>
Wrap an handler initializer to check versions headers.

**Kind**: global function  
**Returns**: <code>function</code> - The handler initializer wrapped  

| Param | Type | Description |
| --- | --- | --- |
| initHandler | <code>function</code> | The handler initializer |

<a name="augmentAPIWithVersionsHeaders"></a>

## augmentAPIWithVersionsHeaders(API, VERSIONS) ⇒ <code>Promise.&lt;Object&gt;</code>
Augment an OpenAPI with versions headers added.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - The augmented  OpenAPI object  

| Param | Type | Description |
| --- | --- | --- |
| API | <code>Object</code> | The OpenAPI object |
| VERSIONS | <code>Object</code> | The versions configurations |

