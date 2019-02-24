# API
## Functions

<dl>
<dt><a href="#initHTTPServer">initHTTPServer(services)</a> ⇒ <code><a href="#HTTPServer">Promise.&lt;HTTPServer&gt;</a></code></dt>
<dd><p>Initialize an HTTP server</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#HTTPServer">HTTPServer</a></dt>
<dd></dd>
</dl>

<a name="initHTTPServer"></a>

## initHTTPServer(services) ⇒ [<code>Promise.&lt;HTTPServer&gt;</code>](#HTTPServer)
Initialize an HTTP server

**Kind**: global function  
**Returns**: [<code>Promise.&lt;HTTPServer&gt;</code>](#HTTPServer) - A promise of an object with a NodeJS HTTP server
 in its `service` property.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services the server depends on |
| services.ENV | <code>Object</code> |  | The process environment variables |
| services.ENV.DESTROY_SOCKETS | <code>String</code> |  | Whether the server sockets whould be destroyed or if the  server should wait while sockets are kept alive |
| services.HOST | <code>String</code> |  | The server host |
| services.PORT | <code>Number</code> |  | The server port |
| services.MAX_HEADERS_COUNT | <code>Number</code> |  | The https://nodejs.org/api/http.html#http_server_maxheaderscount |
| services.KEEP_ALIVE_TIMEOUT | <code>Number</code> |  | See https://nodejs.org/api/http.html#http_server_keepalivetimeout |
| services.MAX_CONNECTIONS | <code>Number</code> |  | See https://nodejs.org/api/net.html#net_server_maxconnections |
| services.TIMEOUT | <code>Number</code> |  | See https://nodejs.org/api/http.html#http_server_timeout |
| services.httpRouter | <code>function</code> |  | The function to run with the req/res tuple |
| [services.log] | <code>function</code> | <code>noop</code> | A logging function |

<a name="HTTPServer"></a>

## HTTPServer
**Kind**: global typedef  
