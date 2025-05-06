# API
## Functions

<dl>
<dt><a href="#prepareProcess">prepareProcess(servicesNames, $)</a> ⇒</dt>
<dd><p>Runs the Whook&#39;s process</p>
</dd>
<dt><a href="#prepareEnvironment">prepareEnvironment($)</a> ⇒</dt>
<dd><p>Prepare the Whook process environment</p>
</dd>
<dt><a href="#pickFirstHeaderValue">pickFirstHeaderValue(name, headers)</a> ⇒ <code>string</code></dt>
<dd><p>Pick the first header value if exists</p>
</dd>
<dt><a href="#pickAllHeaderValues">pickAllHeaderValues(name, headers)</a> ⇒ <code>Array</code></dt>
<dd><p>Pick header values</p>
</dd>
<dt><a href="#initAPM">initAPM(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Application monitoring service that simply log stringified contents.</p>
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
<dt><a href="#initCommands">initCommands(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Initialize the COMMANDS service gathering the project commands.</p>
</dd>
<dt><a href="#initCronsDefinitions">initCronsDefinitions(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Initialize the CRONS_DEFINITIONS service gathering the project crons.</p>
</dd>
<dt><a href="#initCronsHandlers">initCronsHandlers(services)</a> ⇒ <code>Promise.&lt;function()&gt;</code></dt>
<dd><p>Initialize the Whook cron handlers used by the router
 to know which cron to run for a given cron name.</p>
</dd>
<dt><a href="#initCronsWrappers">initCronsWrappers(services)</a> ⇒ <code>Promise.&lt;function()&gt;</code></dt>
<dd><p>A simple passthrough service proxying the CRONS_WRAPPERS.</p>
</dd>
<dt><a href="#initDefinitions">initDefinitions(services)</a> ⇒ <code>Promise.&lt;String&gt;</code></dt>
<dd><p>Initialize the DEFINITIONS service.</p>
</dd>
<dt><a href="#initErrorHandler">initErrorHandler(services)</a> ⇒ <code>Promise</code></dt>
<dd><p>Initialize an error handler for the
HTTP router</p>
</dd>
<dt><a href="#initHost">initHost(services)</a> ⇒ <code>Promise.&lt;String&gt;</code></dt>
<dd><p>Initialize the HOST service from ENV or auto-detection if
 none specified in ENV</p>
</dd>
<dt><a href="#initHTTPRouter">initHTTPRouter(services)</a> ⇒ <code>Promise</code></dt>
<dd><p>Initialize an HTTP router</p>
</dd>
<dt><a href="#initHTTPServer">initHTTPServer(services)</a> ⇒ <code><a href="#HTTPServer">Promise.&lt;HTTPServer&gt;</a></code></dt>
<dd><p>Initialize an HTTP server</p>
</dd>
<dt><a href="#initHTTPTransaction">initHTTPTransaction(services)</a> ⇒ <code><a href="#WhookHTTPTransaction">Promise.&lt;WhookHTTPTransaction&gt;</a></code></dt>
<dd><p>Instantiate the httpTransaction service</p>
</dd>
<dt><a href="#initMainHandler">initMainHandler(services)</a> ⇒ <code>Promise.&lt;function()&gt;</code></dt>
<dd><p>An initializer to build a single Whook route handler.</p>
</dd>
<dt><a href="#initObfuscator">initObfuscator(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Obfuscate sensible informations.</p>
</dd>
<dt><a href="#initPort">initPort(services)</a> ⇒ <code>Promise.&lt;Number&gt;</code></dt>
<dd><p>Initialize the PORT service from ENV or auto-detection if
 none specified in ENV</p>
</dd>
<dt><a href="#wrapEnvForBuild">wrapEnvForBuild(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap the ENV service in order to filter ENV vars for the build</p>
</dd>
<dt><a href="#initRoutesDefinitions">initRoutesDefinitions(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Initialize the ROUTES_DEFINITIONS service gathering
 the project routes definitions.</p>
</dd>
<dt><a href="#initRoutesHandlers">initRoutesHandlers(services)</a> ⇒ <code>Promise.&lt;function()&gt;</code></dt>
<dd><p>Initialize the Whook routes handlers used by the router
 to know which handler to run for a given route.</p>
</dd>
<dt><a href="#initRoutesWrappers">initRoutesWrappers(services)</a> ⇒ <code>Promise.&lt;function()&gt;</code></dt>
<dd><p>A simple passthrough service proxying the ROUTES_WRAPPERS.</p>
</dd>
<dt><a href="#initSchemaValidators">initSchemaValidators(services)</a> ⇒ <code>Promise.&lt;Number&gt;</code></dt>
<dd><p>Initialize the schema validator service for
 application schemas validation. This central
 place is aimed to compile schemas once and
 use them many times.</p>
</dd>
<dt><a href="#initWhookResolvedPlugins">initWhookResolvedPlugins(services)</a> ⇒ <code>Promise.&lt;string&gt;</code></dt>
<dd><p>Resolves the Whook plugins from their names</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#HTTPServer">HTTPServer</a></dt>
<dd></dd>
<dt><a href="#WhookHTTPTransaction">WhookHTTPTransaction</a></dt>
<dd></dd>
</dl>

<a name="prepareProcess"></a>

## prepareProcess(servicesNames, $) ⇒
Runs the Whook's process

**Kind**: global function  
**Returns**: Object
A promise of the injected services  

| Param | Type | Description |
| --- | --- | --- |
| servicesNames | <code>Array.&lt;String&gt;</code> | Root dependencies names to instanciate and return |
| $ | <code>Knifecycle</code> | The Knifecycle instance to use for the run |

<a name="prepareEnvironment"></a>

## prepareEnvironment($) ⇒
Prepare the Whook process environment

**Kind**: global function  
**Returns**: Promise<Knifecycle>
A promise of the Knifecycle instance  

| Param | Type | Description |
| --- | --- | --- |
| $ | <code>Knifecycle</code> | The Knifecycle instance to set the various services |

<a name="pickFirstHeaderValue"></a>

## pickFirstHeaderValue(name, headers) ⇒ <code>string</code>
Pick the first header value if exists

**Kind**: global function  
**Returns**: <code>string</code> - The value if defined.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The header name |
| headers | <code>Object</code> | The headers map |

<a name="pickAllHeaderValues"></a>

## pickAllHeaderValues(name, headers) ⇒ <code>Array</code>
Pick header values

**Kind**: global function  
**Returns**: <code>Array</code> - The values in an array.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The header name |
| headers | <code>Object</code> | The headers map |

<a name="initAPM"></a>

## initAPM(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Application monitoring service that simply log stringified contents.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of the apm service.  

| Param | Type | Description |
| --- | --- | --- |
| services | <code>Object</code> | The services to inject |
| [services.log] | <code>function</code> | A logging function |

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
<a name="initCommands"></a>

## initCommands(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Initialize the COMMANDS service gathering the project commands.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of a containing the actual host.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services COMMANDS depends on |
| [services.WHOOK_PLUGINS] | <code>Array.&lt;String&gt;</code> |  | The activated plugins |
| services.WHOOK_RESOLVED_PLUGINS | <code>Array</code> |  | The resolved plugins |
| [services.COMMANDS_DEFINITIONS_OPTIONS] | <code>Object</code> |  | The options to load the project commands |
| [services.COMMAND_DEFINITION_FILTER] | <code>Object</code> |  | A function to filter the project commands per definitions |
| services.importer | <code>Object</code> |  | A service allowing to dynamically import ES modules |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initCronsDefinitions"></a>

## initCronsDefinitions(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Initialize the CRONS_DEFINITIONS service gathering the project crons.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of a containing the actual host.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services CRONS_DEFINITIONS depends on |
| [services.WHOOK_PLUGINS] | <code>Array.&lt;String&gt;</code> |  | The activated plugins |
| services.WHOOK_RESOLVED_PLUGINS | <code>Array</code> |  | The resolved plugins |
| [services.CRONS_DEFINITIONS_OPTIONS] | <code>Object</code> |  | The options to load the project crons |
| [services.CRON_DEFINITION_FILTER] | <code>Object</code> |  | A function to filter the project crons per definitions |
| services.importer | <code>Object</code> |  | A service allowing to dynamically import ES modules |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initCronsHandlers"></a>

## initCronsHandlers(services) ⇒ <code>Promise.&lt;function()&gt;</code>
Initialize the Whook cron handlers used by the router
 to know which cron to run for a given cron name.

**Kind**: global function  
**Returns**: <code>Promise.&lt;function()&gt;</code> - A promise of the `CRONS_HANDLERS` hash.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services `CRONS_HANDLERS` depends on |
| services.CRONS_WRAPPERS | <code>Array</code> |  | An optional list of wrappers to inject |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |
| services.CRONS_HANDLERS | <code>Object</code> |  | The rest is a hash of crons handlers mapped by name |

<a name="initCronsWrappers"></a>

## initCronsWrappers(services) ⇒ <code>Promise.&lt;function()&gt;</code>
A simple passthrough service proxying the CRONS_WRAPPERS.

**Kind**: global function  
**Returns**: <code>Promise.&lt;function()&gt;</code> - A promise of the `CRONS_WRAPPERS` hash.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services `CRONS_WRAPPERS` depends on |
| [services.CRONS_WRAPPERS_NAMES] | <code>Array</code> |  | The global wrappers names to wrap the crons with |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |
| services.CRONS_WRAPPERS | <code>Object</code> |  | The dependencies must all be injected wrappers |

<a name="initDefinitions"></a>

## initDefinitions(services) ⇒ <code>Promise.&lt;String&gt;</code>
Initialize the DEFINITIONS service.

**Kind**: global function  
**Returns**: <code>Promise.&lt;String&gt;</code> - A promise of a containing the actual host.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services DEFINITIONS depends on |
| [services.ROUTES_DEFINITIONS] | <code>Object</code> |  | The API routes modules |
| [services.COMMANDS_DEFINITIONS] | <code>Object</code> |  | The commands modules |
| [services.CRONS_DEFINITIONS] | <code>Object</code> |  | The crons modules |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initErrorHandler"></a>

## initErrorHandler(services) ⇒ <code>Promise</code>
Initialize an error handler for the
HTTP router

**Kind**: global function  
**Returns**: <code>Promise</code> - A promise of a function to handle errors  

| Param | Type | Description |
| --- | --- | --- |
| services | <code>Object</code> | The services the server depends on |
| services.ENV | <code>Object</code> | The app ENV |
| [services.DEBUG_NODE_ENVS] | <code>Array</code> | The environnement that activate debugging  (prints stack trace in HTTP errors responses) |
| [services.STRINGIFIERS] | <code>Object</code> | The synchronous body stringifiers |
| [services.ERRORS_DESCRIPTORS] | <code>Object</code> | An hash of the various error descriptors |
| [services.DEFAULT_ERROR_CODE] | <code>Object</code> | A string giving the default error code |

<a name="initErrorHandler..errorHandler"></a>

### initErrorHandler~errorHandler(transactionId, responseSpec, err) ⇒ <code>Promise</code>
Handle an HTTP transaction error and
map it to a serializable response

**Kind**: inner method of [<code>initErrorHandler</code>](#initErrorHandler)  
**Returns**: <code>Promise</code> - A promise resolving when the operation
 completes  

| Param | Type | Description |
| --- | --- | --- |
| transactionId | <code>String</code> | A raw NodeJS HTTP incoming message |
| responseSpec | <code>Object</code> | The response specification |
| err | <code>YHTTPError</code> | The encountered error |

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

<a name="initHTTPRouter"></a>

## initHTTPRouter(services) ⇒ <code>Promise</code>
Initialize an HTTP router

**Kind**: global function  
**Returns**: <code>Promise</code> - A promise of a function to handle HTTP requests.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services the server depends on |
| [services.BUFFER_LIMIT] | <code>String</code> |  | The maximum bufferisation before parsing the  request body |
| [services.BASE_PATH] | <code>String</code> |  | API base path |
| services.ROUTES_HANDLERS | <code>Object</code> |  | The handlers for the operations decribe  by the OpenAPI API definition |
| services.API | <code>Object</code> |  | The OpenAPI definition of the API |
| [services.PARSERS] | <code>Object</code> |  | The synchronous body parsers (for operations  that defines a request body schema) |
| [services.STRINGIFIERS] | <code>Object</code> |  | The synchronous body stringifiers (for  operations that defines a response body  schema) |
| [services.ENCODERS] | <code>Object</code> |  | A map of encoder stream constructors |
| [services.DECODERS] | <code>Object</code> |  | A map of decoder stream constructors |
| [services.queryParserBuilder] | <code>Object</code> |  | A query parser builder from OpenAPI parameters |
| [services.COERCION_OPTIONS] | <code>Object</code> |  | Options for type coercion of parameters values |
| [services.log] | <code>function</code> | <code>noop</code> | A logging function |
| services.httpTransaction | <code>function</code> |  | A function to create a new HTTP transaction |

<a name="initHTTPRouter..httpRouter"></a>

### initHTTPRouter~httpRouter(req, res) ⇒ <code>Promise</code>
Handle an HTTP incoming message

**Kind**: inner method of [<code>initHTTPRouter</code>](#initHTTPRouter)  
**Returns**: <code>Promise</code> - A promise resolving when the operation
 completes  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>HTTPRequest</code> | A raw NodeJS HTTP incoming message |
| res | <code>HTTPResponse</code> | A raw NodeJS HTTP response |

<a name="initHTTPServer"></a>

## initHTTPServer(services) ⇒ [<code>Promise.&lt;HTTPServer&gt;</code>](#HTTPServer)
Initialize an HTTP server

**Kind**: global function  
**Returns**: [<code>Promise.&lt;HTTPServer&gt;</code>](#HTTPServer) - A promise of an object with a NodeJS HTTP server
 in its `service` property.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services the server depends on |
| [services.ENV] | <code>Object</code> |  | The process environment variables |
| services.ENV.DESTROY_SOCKETS | <code>String</code> |  | Whether the server sockets whould be destroyed or if the  server should wait while sockets are kept alive |
| [services.HTTP_SERVER_OPTIONS] | <code>Object</code> |  | See https://nodejs.org/docs/latest/api/http.html#class-httpserver |
| services.HOST | <code>String</code> |  | The server host |
| services.PORT | <code>Number</code> |  | The server port |
| services.httpRouter | <code>function</code> |  | The function to run with the req/res tuple |
| [services.log] | <code>function</code> | <code>noop</code> | A logging function |

<a name="initHTTPTransaction"></a>

## initHTTPTransaction(services) ⇒ [<code>Promise.&lt;WhookHTTPTransaction&gt;</code>](#WhookHTTPTransaction)
Instantiate the httpTransaction service

**Kind**: global function  
**Returns**: [<code>Promise.&lt;WhookHTTPTransaction&gt;</code>](#WhookHTTPTransaction) - A promise of the httpTransaction function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services to inject |
| [services.TIMEOUT] | <code>Number</code> | <code>30000</code> | A number indicating how many ms the transaction  should take to complete before being cancelled. |
| [services.TRANSACTIONS] | <code>Object</code> | <code>{}</code> | A hash of every current transactions |
| services.delay | <code>Object</code> |  | A delaying service |
| services.obfuscator | <code>Object</code> |  | A service to avoid logging sensible informations |
| [services.log] | <code>function</code> |  | A logging function |
| [services.apm] | <code>function</code> |  | An apm function |
| [services.time] | <code>function</code> |  | A timing function |
| [services.uniqueId] | <code>function</code> |  | A function returning unique identifiers |

**Example**  
```js
import initHTTPTransaction from '@whook/whook';
import { log } from 'node:console';

const httpTransaction = await initHTTPTransaction({
  log,
  time: Date.now.bind(Date),
});
```
<a name="initHTTPTransaction..httpTransaction"></a>

### initHTTPTransaction~httpTransaction(req, res) ⇒ <code>Array</code>
Create a new HTTP transaction

**Kind**: inner method of [<code>initHTTPTransaction</code>](#initHTTPTransaction)  
**Returns**: <code>Array</code> - The normalized request and the HTTP
transaction created in an array.  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>HTTPRequest</code> | A raw NodeJS HTTP incoming message |
| res | <code>HTTPResponse</code> | A raw NodeJS HTTP response |

<a name="initMainHandler"></a>

## initMainHandler(services) ⇒ <code>Promise.&lt;function()&gt;</code>
An initializer to build a single Whook route handler.

**Kind**: global function  
**Returns**: <code>Promise.&lt;function()&gt;</code> - A promise of the `MAIN_HANDLER` service.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services `$autoload` depends on |
| services.WRAPPERS | <code>Array</code> |  | An optional list of wrappers to inject |
| services.MAIN_WRAPPER | <code>function</code> |  | The main route handle wrapper |
| services.BASE_HANDLER | <code>function</code> |  | The base handler |
| [services.log] | <code>function</code> | <code>noop</code> | An optional logging service |

<a name="initObfuscator"></a>

## initObfuscator(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Obfuscate sensible informations.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the gathered constants.  

| Param | Type | Description |
| --- | --- | --- |
| services | <code>Object</code> | The service dependend on |
| [services.SHIELD_CHAR] | <code>Object</code> | The char for replacing sensible informations |
| [services.MAX_CLEAR_CHARS] | <code>Object</code> | The maximum clear chars to display |
| [services.MAX_CLEAR_RATIO] | <code>Object</code> | The maximum clear chars ratio to display |
| [services.SENSIBLE_PROPS] | <code>Object</code> | Sensible properties names |
| [services.SENSIBLE_HEADERS] | <code>Object</code> | Sensible headers names |

**Example**  
```js
import { initObfuscator } from '@whook/whook';
import { alsoInject } from 'knifecycle';
import { log } from 'node:console';

const obfuscator = await initObfuscator();

log(obfuscator('my very secret information!));
// my ...on!
```
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
| [services.PROXIED_ENV_VARS] | <code>Object</code> | <code>{}</code> | A list of environment variable names to proxy |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initRoutesDefinitions"></a>

## initRoutesDefinitions(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Initialize the ROUTES_DEFINITIONS service gathering
 the project routes definitions.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of a containing the actual host.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services ROUTES_DEFINITIONS depends on |
| [services.WHOOK_PLUGINS] | <code>Array.&lt;String&gt;</code> |  | The activated plugins |
| services.WHOOK_RESOLVED_PLUGINS | <code>Array</code> |  | The resolved plugins |
| [services.ROUTES_DEFINITIONS_OPTIONS] | <code>Object</code> |  | The options to load the routes in the file system |
| [services.ROUTE_DEFINITION_FILTER] | <code>Object</code> |  | A function to filter the routes per definitions |
| services.importer | <code>Object</code> |  | A service allowing to dynamically import ES modules |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initRoutesHandlers"></a>

## initRoutesHandlers(services) ⇒ <code>Promise.&lt;function()&gt;</code>
Initialize the Whook routes handlers used by the router
 to know which handler to run for a given route.

**Kind**: global function  
**Returns**: <code>Promise.&lt;function()&gt;</code> - A promise of the `ROUTES_HANDLERS` hash.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services `ROUTES_HANDLERS` depends on |
| services.ROUTES_WRAPPERS | <code>Array</code> |  | An optional list of wrappers to inject |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |
| services.ROUTES_HANDLERS | <code>Object</code> |  | The rest is a hash of routesHandlers mapped by their operation id |

<a name="initRoutesWrappers"></a>

## initRoutesWrappers(services) ⇒ <code>Promise.&lt;function()&gt;</code>
A simple passthrough service proxying the ROUTES_WRAPPERS.

**Kind**: global function  
**Returns**: <code>Promise.&lt;function()&gt;</code> - A promise of the `ROUTES_WRAPPERS` hash.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services `ROUTES_WRAPPERS` depends on |
| [services.ROUTES_WRAPPERS_NAMES] | <code>Array</code> |  | The global wrappers names to wrap the routes with |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |
| services.ROUTES_WRAPPERS | <code>Object</code> |  | The dependencies must all be injected wrappers |

<a name="initSchemaValidators"></a>

## initSchemaValidators(services) ⇒ <code>Promise.&lt;Number&gt;</code>
Initialize the schema validator service for
 application schemas validation. This central
 place is aimed to compile schemas once and
 use them many times.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Number&gt;</code> - A promise of a schema validators registry  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services it depends on |
| [services.SCHEMA_VALIDATORS_OPTIONS] | <code>Object</code> | <code>{}</code> | Options for the schema validators registry |
| [services.ENV] | <code>Object</code> | <code>{}</code> | An optional environment object |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |
| services.API | <code>Object</code> |  | A valid Open API file |

<a name="initWhookResolvedPlugins"></a>

## initWhookResolvedPlugins(services) ⇒ <code>Promise.&lt;string&gt;</code>
Resolves the Whook plugins from their names

**Kind**: global function  
**Returns**: <code>Promise.&lt;string&gt;</code> - A promise of a number representing the actual port.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services WHOOK_RESOLVED_PLUGINS depends on |
| [services.WHOOK_PLUGINS] | <code>Array.&lt;String&gt;</code> |  | The activated plugins |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="HTTPServer"></a>

## HTTPServer
**Kind**: global typedef  
<a name="WhookHTTPTransaction"></a>

## WhookHTTPTransaction
**Kind**: global typedef  

* [WhookHTTPTransaction](#WhookHTTPTransaction)
    * [.id](#WhookHTTPTransaction.id)
    * [.start](#WhookHTTPTransaction.start) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.catch](#WhookHTTPTransaction.catch) ⇒ <code>Promise</code>
    * [.end](#WhookHTTPTransaction.end) ⇒ <code>Promise.&lt;Object&gt;</code>

<a name="WhookHTTPTransaction.id"></a>

### WhookHTTPTransaction.id
Id of the transaction

**Kind**: static property of [<code>WhookHTTPTransaction</code>](#WhookHTTPTransaction)  
<a name="WhookHTTPTransaction.start"></a>

### WhookHTTPTransaction.start ⇒ <code>Promise.&lt;Object&gt;</code>
Start the transaction

**Kind**: static property of [<code>WhookHTTPTransaction</code>](#WhookHTTPTransaction)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise to be resolved with the signed token.  

| Param | Type | Description |
| --- | --- | --- |
| buildResponse | <code>function</code> | A function that builds a response |

<a name="WhookHTTPTransaction.catch"></a>

### WhookHTTPTransaction.catch ⇒ <code>Promise</code>
Catch a transaction error

**Kind**: static property of [<code>WhookHTTPTransaction</code>](#WhookHTTPTransaction)  
**Returns**: <code>Promise</code> - A promise to be resolved with the signed token.  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Error</code> | A function that builds a response |

<a name="WhookHTTPTransaction.end"></a>

### WhookHTTPTransaction.end ⇒ <code>Promise.&lt;Object&gt;</code>
End the transaction

**Kind**: static property of [<code>WhookHTTPTransaction</code>](#WhookHTTPTransaction)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise to be resolved with the signed token.  

| Param | Type | Description |
| --- | --- | --- |
| response | <code>Object</code> | A response for the transaction |

