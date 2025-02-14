# API
## Functions

<dl>
<dt><a href="#initHandler">initHandler(services)</a> ⇒ <code>Promise.&lt;function()&gt;</code></dt>
<dd><p>Initialize one Whook handler</p>
</dd>
<dt><a href="#initWrapHandlerForGoogleHTTPFunction">initWrapHandlerForGoogleHTTPFunction(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap an handler to make it work with GCP Functions.</p>
</dd>
</dl>

<a name="initHandler"></a>

## initHandler(services) ⇒ <code>Promise.&lt;function()&gt;</code>
Initialize one Whook handler

**Kind**: global function  
**Returns**: <code>Promise.&lt;function()&gt;</code> - A promise of the `HANDLERS` hash.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services `$autoload` depends on |
| services.WRAPPERS | <code>Array</code> |  | An optional list of wrappers to inject |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |
| services.HANDLERS | <code>Object</code> |  | The rest is a hash of handlers mapped by their operation id |

<a name="initWrapHandlerForGoogleHTTPFunction"></a>

## initWrapHandlerForGoogleHTTPFunction(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with GCP Functions.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services the wrapper depends on |
| services.OPERATION_API | <code>Object</code> |  | An OpenAPI definitition for that handler |
| services.DECODERS | <code>Object</code> |  | Request body decoders available |
| services.ENCODERS | <code>Object</code> |  | Response body encoders available |
| services.PARSERS | <code>Object</code> |  | Request body parsers available |
| services.STRINGIFYERS | <code>Object</code> |  | Response body stringifyers available |
| services.BUFFER_LIMIT | <code>Object</code> |  | The buffer size limit |
| services.queryParserBuilder | <code>Object</code> |  | A query parser builder from OpenAPI parameters |
| services.obfuscator | <code>Object</code> |  | A service to hide sensible values |
| services.errorHandler | <code>Object</code> |  | A service that changes any error to Whook response |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

