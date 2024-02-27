# API
## Functions

<dl>
<dt><a href="#prepareServer">prepareServer(injectedNames, $)</a> ⇒</dt>
<dd><p>Runs the Whook server</p>
</dd>
<dt><a href="#prepareEnvironment">prepareEnvironment($)</a> ⇒</dt>
<dd><p>Prepare the Whook server environment</p>
</dd>
<dt><a href="#initAPIDefinitions">initAPIDefinitions(services)</a> ⇒ <code>Promise.&lt;String&gt;</code></dt>
<dd><p>Initialize the API_DEFINITIONS service according to the porject handlers.</p>
</dd>
<dt><a href="#initBaseURL">initBaseURL(services)</a> ⇒ <code>Promise.&lt;String&gt;</code></dt>
<dd><p>Initialize the BASE_URL service according to the HOST/PORT
 so that applications fallbacks to that default base URL.</p>
</dd>
<dt><a href="#initBuildConstants">initBuildConstants(constants)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Allow to proxy constants directly by serializing it in the
 build, saving some computing and increasing boot time of
 the build.</p>
</dd>
<dt><a href="#initHandlers">initHandlers(services)</a> ⇒ <code>Promise.&lt;function()&gt;</code></dt>
<dd><p>Initialize the Whook handlers used byt the router
 to know which handler to run for a given open API
 operation id.</p>
</dd>
<dt><a href="#initHost">initHost(services)</a> ⇒ <code>Promise.&lt;String&gt;</code></dt>
<dd><p>Initialize the HOST service from ENV or auto-detection if
 none specified in ENV</p>
</dd>
<dt><a href="#initPort">initPort(services)</a> ⇒ <code>Promise.&lt;Number&gt;</code></dt>
<dd><p>Initialize the PORT service from ENV or auto-detection if
 none specified in ENV</p>
</dd>
<dt><a href="#wrapEnvForBuild">wrapEnvForBuild(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap the ENV service in order to filter ENV vars for the build</p>
</dd>
<dt><a href="#initResolvedWhookPlugins">initResolvedWhookPlugins(services)</a> ⇒ <code>Promise.&lt;string&gt;</code></dt>
<dd><p>Resolves the Whook plugins from their names</p>
</dd>
<dt><a href="#initWrappers">initWrappers(services)</a> ⇒ <code>Promise.&lt;function()&gt;</code></dt>
<dd><p>A simple passthrough service proxing the WRAPPERS.</p>
</dd>
</dl>

<a name="prepareServer"></a>

## prepareServer(injectedNames, $) ⇒
Runs the Whook server

**Kind**: global function  
**Returns**: Object
A promise of the injected services  

| Param | Type | Description |
| --- | --- | --- |
| injectedNames | <code>Array.&lt;String&gt;</code> | Root dependencies names to instanciate and return |
| $ | <code>Knifecycle</code> | The Knifecycle instance to use for the server run |

<a name="prepareEnvironment"></a>

## prepareEnvironment($) ⇒
Prepare the Whook server environment

**Kind**: global function  
**Returns**: Promise<Knifecycle>
A promise of the Knifecycle instance  

| Param | Type | Description |
| --- | --- | --- |
| $ | <code>Knifecycle</code> | The Knifecycle instance to set the various services |

<a name="initAPIDefinitions"></a>

## initAPIDefinitions(services) ⇒ <code>Promise.&lt;String&gt;</code>
Initialize the API_DEFINITIONS service according to the porject handlers.

**Kind**: global function  
**Returns**: <code>Promise.&lt;String&gt;</code> - A promise of a containing the actual host.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services API_DEFINITIONS depends on |
| [services.WHOOK_PLUGINS] | <code>Array.&lt;String&gt;</code> |  | The activated plugins |
| services.WHOOK_RESOLVED_PLUGINS | <code>Array</code> |  | The resolved plugins |
| [services.IGNORED_FILES_SUFFIXES] | <code>Object</code> |  | The files suffixes the autoloader must ignore |
| [services.IGNORED_FILES_PREFIXES] | <code>Object</code> |  | The files prefixes the autoloader must ignore |
| [services.FILTER_API_DEFINITION] | <code>Object</code> |  | Allows to filter endpoints if the custom function returns true |
| services.importer | <code>Object</code> |  | A service allowing to dynamically import ES modules |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initBaseURL"></a>

## initBaseURL(services) ⇒ <code>Promise.&lt;String&gt;</code>
Initialize the BASE_URL service according to the HOST/PORT
 so that applications fallbacks to that default base URL.

**Kind**: global function  
**Returns**: <code>Promise.&lt;String&gt;</code> - A promise of a containing the actual host.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services BASE_URL depends on |
| services.ENV | <code>Object</code> |  | The process environment |
| services.CONFIG | <code>Object</code> |  | The injected CONFIG value |
| [services.PROTOCOL] | <code>Object</code> |  | The injected PROTOCOL value |
| services.HOST | <code>Object</code> |  | The injected HOST value |
| services.PORT | <code>Object</code> |  | The injected PORT value |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initBuildConstants"></a>

## initBuildConstants(constants) ⇒ <code>Promise.&lt;Object&gt;</code>
Allow to proxy constants directly by serializing it in the
 build, saving some computing and increasing boot time of
 the build.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the gathered constants.  

| Param | Type | Description |
| --- | --- | --- |
| constants | <code>Object</code> | The serializable constants to gather |

**Example**  
```js
import { initBuildConstants } from '@whook/whook';
import { alsoInject } from 'knifecycle';

export default alsoInject(['MY_OWN_CONSTANT'], initBuildConstants);
```
<a name="initHandlers"></a>

## initHandlers(services) ⇒ <code>Promise.&lt;function()&gt;</code>
Initialize the Whook handlers used byt the router
 to know which handler to run for a given open API
 operation id.

**Kind**: global function  
**Returns**: <code>Promise.&lt;function()&gt;</code> - A promise of the `HANDLERS` hash.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services `HANDLERS` depends on |
| services.WRAPPERS | <code>Array</code> |  | An optional list of wrappers to inject |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |
| services.HANDLERS | <code>Object</code> |  | The rest is a hash of handlers mapped by their operation id |

<a name="initHost"></a>

## initHost(services) ⇒ <code>Promise.&lt;String&gt;</code>
Initialize the HOST service from ENV or auto-detection if
 none specified in ENV

**Kind**: global function  
**Returns**: <code>Promise.&lt;String&gt;</code> - A promise of a containing the actual host.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services HOST depends on |
| [services.ENV] | <code>Object</code> | <code>{}</code> | An optional environment object |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |
| services.importer | <code>Object</code> |  | A service allowing to dynamically import ES modules |

<a name="initPort"></a>

## initPort(services) ⇒ <code>Promise.&lt;Number&gt;</code>
Initialize the PORT service from ENV or auto-detection if
 none specified in ENV

**Kind**: global function  
**Returns**: <code>Promise.&lt;Number&gt;</code> - A promise of a number representing the actual port.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services PORT depends on |
| [services.ENV] | <code>Object</code> | <code>{}</code> | An optional environment object |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |
| services.importer | <code>Object</code> |  | A service allowing to dynamically import ES modules |

<a name="wrapEnvForBuild"></a>

## wrapEnvForBuild(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap the ENV service in order to filter ENV vars for the build

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services ENV depends on |
| [services.PROXYED_ENV_VARS] | <code>Object</code> | <code>{}</code> | A list of environment variable names to proxy |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initResolvedWhookPlugins"></a>

## initResolvedWhookPlugins(services) ⇒ <code>Promise.&lt;string&gt;</code>
Resolves the Whook plugins from their names

**Kind**: global function  
**Returns**: <code>Promise.&lt;string&gt;</code> - A promise of a number representing the actual port.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services WHOOK_RESOLVED_PLUGINS depends on |
| [services.WHOOK_PLUGINS] | <code>Array.&lt;String&gt;</code> |  | The activated plugins |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initWrappers"></a>

## initWrappers(services) ⇒ <code>Promise.&lt;function()&gt;</code>
A simple passthrough service proxing the WRAPPERS.

**Kind**: global function  
**Returns**: <code>Promise.&lt;function()&gt;</code> - A promise of the `HANDLERS` hash.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services `WRAPPERS` depends on |
| [services.HANDLERS_WRAPPERS] | <code>Array</code> |  | The global wrappers names to wrap the handlers with |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |
| services.WRAPPERS | <code>Object</code> |  | The dependencies must all be injected wrappers |

