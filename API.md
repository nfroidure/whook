# API
## Functions

<dl>
<dt><a href="#runServer">runServer(injectedNames, $)</a> ⇒</dt>
<dd><p>Runs the Whook server</p>
</dd>
<dt><a href="#prepareServer">prepareServer($)</a> ⇒</dt>
<dd></dd>
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

