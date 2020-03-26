# API
## Members

<dl>
<dt><a href="#default">default</a> ⇒ <code>Promise</code></dt>
<dd><p>Initialize the GraphQL service</p>
</dd>
<dt><a href="#default">default</a> ⇒ <code>Promise</code></dt>
<dd><p>Initialize the GraphQL service</p>
</dd>
</dl>

<a name="default"></a>

## default ⇒ <code>Promise</code>
Initialize the GraphQL service

**Kind**: global variable  
**Returns**: <code>Promise</code> - A promise of a GraphQL service  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services the server depends on |
| services.NODE_ENV | <code>Object</code> |  | The injected NODE_ENV value |
| [services.GRAPHQL_OPTIONS] | <code>Array</code> |  | The GraphQL options to pass to the schema |
| ENV | <code>String</code> |  | The process environment |
| [graphQLFragments] | <code>String</code> |  | Fragments of GraphQL schemas/resolvers declaration |
| [services.log] | <code>function</code> | <code>noop</code> | A logging function |
| [services.time] | <code>function</code> |  | A function returning the current timestamp |

<a name="default"></a>

## default ⇒ <code>Promise</code>
Initialize the GraphQL service

**Kind**: global variable  
**Returns**: <code>Promise</code> - A promise of a GraphQL service  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services the server depends on |
| services.NODE_ENV | <code>Object</code> |  | The injected NODE_ENV value |
| [services.GRAPHQL_SERVER_OPTIONS] | <code>Object</code> \| <code>function</code> |  | The GraphQL options to pass to the server |
| ENV | <code>String</code> |  | The process environment |
| [graphQLFragments] | <code>String</code> |  | Fragments of GraphQL schemas/resolvers declaration |
| [services.log] | <code>function</code> | <code>noop</code> | A logging function |
| [services.time] | <code>function</code> |  | A function returning the current timestamp |

