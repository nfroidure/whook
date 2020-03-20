# API
## Members

<dl>
<dt><a href="#default">default</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap the ENV service in order to filter ENV vars for the build</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#initBuildConstants">initBuildConstants(constants)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Allow to proxy constants directly by serializing it in the
 build, saving some computing and increasing boot time of
 lambdas.</p>
</dd>
</dl>

<a name="default"></a>

## default ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap the ENV service in order to filter ENV vars for the build

**Kind**: global variable  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services ENV depends on |
| services.NODE_ENV | <code>Object</code> |  | The injected NODE_ENV value to add it to the build env |
| [services.PROXYED_ENV_VARS] | <code>Object</code> | <code>{}</code> | A list of environment variable names to proxy |
| [log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initBuildConstants"></a>

## initBuildConstants(constants) ⇒ <code>Promise.&lt;Object&gt;</code>
Allow to proxy constants directly by serializing it in the
 build, saving some computing and increasing boot time of
 lambdas.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the gathered constants.  

| Param | Type | Description |
| --- | --- | --- |
| constants | <code>Object</code> | The serializable constants to gather |

**Example**  
```js
import { initBuildConstants } from '@whook/aws-lambda';
import { alsoInject } from 'knifecycle';

export default alsoInject(['MY_OWN_CONSTANT'], initBuildConstants);
```
