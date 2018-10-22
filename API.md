# API
## Functions

<dl>
<dt><a href="#runServer">runServer(injectedNames, $)</a> ⇒</dt>
<dd><p>Runs the Whook server</p>
</dd>
<dt><a href="#prepareServer">prepareServer($)</a> ⇒</dt>
<dd></dd>
<dt><a href="#initENV">initENV(services, [log])</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Initialize the ENV service using process env plus dotenv files</p>
</dd>
<dt><a href="#initHOST">initHOST(services, [log])</a> ⇒ <code>Promise.&lt;String&gt;</code></dt>
<dd><p>Initialize the HOST service from ENV or auto-detection if
 none specified in ENV</p>
</dd>
<dt><a href="#initPORT">initPORT(services, [log])</a> ⇒ <code>Promise.&lt;Number&gt;</code></dt>
<dd><p>Initialize the PORT service from ENV or auto-detection if
 none specified in ENV</p>
</dd>
</dl>

<a name="runServer"></a>

## runServer(injectedNames, $) ⇒
Runs the Whook server

**Kind**: global function  
**Returns**: Object
A promise of the injected services  

| Param | Type | Description |
| --- | --- | --- |
| injectedNames | <code>Array.&lt;String&gt;</code> | Root dependencies names to instanciate and return |
| $ | <code>Knifecycle</code> | The Knifecycle instance to use for the server run |

<a name="prepareServer"></a>

## prepareServer($) ⇒
**Kind**: global function  
**Returns**: Promise<Knifecycle>
A promise of the Knifecycle instance  

| Param | Type | Description |
| --- | --- | --- |
| $ | <code>Knifecycle</code> | The Knifecycle instance to set the various services |

<a name="initENV"></a>

## initENV(services, [log]) ⇒ <code>Promise.&lt;Object&gt;</code>
Initialize the ENV service using process env plus dotenv files

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the actual env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services ENV depends on |
| services.NODE_ENV | <code>Object</code> |  | The injected NODE_ENV value to lookk for `.env.${NODE_ENV}` env file |
| services.PWD | <code>Object</code> |  | The process current working directory |
| [services.BASE_ENV] | <code>Object</code> | <code>{}</code> | An optional base environment |
| [log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initHOST"></a>

## initHOST(services, [log]) ⇒ <code>Promise.&lt;String&gt;</code>
Initialize the HOST service from ENV or auto-detection if
 none specified in ENV

**Kind**: global function  
**Returns**: <code>Promise.&lt;String&gt;</code> - A promise of a containing the actual host.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services HOST depends on |
| [services.ENV] | <code>Object</code> | <code>{}</code> | An optional environment object |
| [log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initPORT"></a>

## initPORT(services, [log]) ⇒ <code>Promise.&lt;Number&gt;</code>
Initialize the PORT service from ENV or auto-detection if
 none specified in ENV

**Kind**: global function  
**Returns**: <code>Promise.&lt;Number&gt;</code> - A promise of a number representing the actual port.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services PORT depends on |
| [services.ENV] | <code>Object</code> | <code>{}</code> | An optional environment object |
| [log] | <code>Object</code> | <code>noop</code> | An optional logging service |

