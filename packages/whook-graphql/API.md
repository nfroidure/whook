# API
<a name="initGraphQL"></a>

## initGraphQL(services, ENV, [graphQLFragments]) ⇒ <code>Promise</code>
Initialize the GraphQL service

**Kind**: global function  
**Returns**: <code>Promise</code> - A promise of a GraphQL service  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services the server depends on |
| services.ENV | <code>Object</code> |  | The injected ENV value |
| [services.GRAPHQL_SERVER_OPTIONS] | <code>Object</code> \| <code>function</code> |  | The GraphQL options to pass to the server |
| ENV | <code>String</code> |  | The process environment |
| [graphQLFragments] | <code>String</code> |  | Fragments of GraphQL schemas/resolvers declaration |
| [services.log] | <code>function</code> | <code>noop</code> | A logging function |

