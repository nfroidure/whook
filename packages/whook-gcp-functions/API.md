# API
<a name="initWrapRouteHandlerForGoogleHTTPFunction"></a>

## initWrapRouteHandlerForGoogleHTTPFunction(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with GCP Functions.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services the wrapper depends on |
| services.MAIN_DEFINITION | <code>Object</code> |  | An OpenAPI definitition for that handler |
| services.DECODERS | <code>Object</code> |  | Request body decoders available |
| services.ENCODERS | <code>Object</code> |  | Response body encoders available |
| services.PARSERS | <code>Object</code> |  | Request body parsers available |
| services.STRINGIFIERS | <code>Object</code> |  | Response body stringifiers available |
| services.BUFFER_LIMIT | <code>Object</code> |  | The buffer size limit |
| services.queryParserBuilder | <code>Object</code> |  | A query parser builder from OpenAPI parameters |
| services.obfuscator | <code>Object</code> |  | A service to hide sensible values |
| services.errorHandler | <code>Object</code> |  | A service that changes any error to Whook response |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

