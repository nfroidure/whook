# API
<a name="initWrapHandlerForHTTPFunction"></a>

## initWrapHandlerForHTTPFunction(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with cron AWS Lambda.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services the wrapper depends on |
| services.ENV | <code>Object</code> |  | The process environment |
| services.OPERATION_API | <code>Object</code> |  | An OpenAPI definitition for that handler |
| services.apm | <code>Object</code> |  | An application monitoring service |
| [services.time] | <code>Object</code> |  | An optional time service |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

