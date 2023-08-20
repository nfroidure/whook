# API
<a name="initWrapHandlerWithAuthorization"></a>

## initWrapHandlerWithAuthorization(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to check client's authorizations.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services ENV depends on |
| [services.MECHANISMS] | <code>Array</code> |  | The list of supported auth mechanisms |
| [services.DEFAULT_MECHANISM] | <code>string</code> |  | The default authentication mechanism |
| services.authentication | <code>Object</code> |  | The authentication service |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

