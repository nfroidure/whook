# API
<a name="initBuildConstantFilter"></a>

## initBuildConstantFilter(services) ⇒ <code>Promise.&lt;function()&gt;</code>
Allow to proxy constants directly by serializing it in the
 build, saving some computing and increasing boot time of
 the build.

**Kind**: global function  
**Returns**: <code>Promise.&lt;function()&gt;</code> - A promise of filter function.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The service dependencies |
| services.BUILD_CONSTANTS_NAMES | <code>Array.&lt;string&gt;</code> |  | The serializable constants name to gather |
| services.BUILD_CONSTANTS_PREFIXES | <code>Array.&lt;string&gt;</code> |  | The serializable constants name prefixes to gather |
| services.BUILD_CONSTANTS_SUFFIXES | <code>Array.&lt;string&gt;</code> |  | The serializable constants name suffixes to gather |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

