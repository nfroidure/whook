# API
## Functions

<dl>
<dt><a href="#initWrapConsumerHandlerForAWSLambda">initWrapConsumerHandlerForAWSLambda(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap an handler to make it work with a consumer AWS Lambda.</p>
</dd>
<dt><a href="#initWrapCronHandlerForAWSLambda">initWrapCronHandlerForAWSLambda(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap an handler to make it work with cron AWS Lambda.</p>
</dd>
<dt><a href="#initWrapKafkaConsumerHandlerForAWSLambda">initWrapKafkaConsumerHandlerForAWSLambda(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap an handler to make it work with a kafka AWS Lambda.</p>
</dd>
<dt><a href="#initWrapLogSubscriberHandlerForAWSLambda">initWrapLogSubscriberHandlerForAWSLambda(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap an handler to make it work with a log subscriber AWS Lambda.</p>
</dd>
<dt><a href="#initWrapRouteHandlerForAWSLambda">initWrapRouteHandlerForAWSLambda(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap an handler to make it work with a route AWS Lambda.</p>
</dd>
<dt><a href="#initWrapS3HandlerForAWSLambda">initWrapS3HandlerForAWSLambda(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap an handler to make it work with a S3 AWS Lambda.</p>
</dd>
<dt><a href="#initWrapTransformerHandlerForAWSLambda">initWrapTransformerHandlerForAWSLambda(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap an handler to make it work with a transformer AWS Lambda.</p>
</dd>
</dl>

<a name="initWrapConsumerHandlerForAWSLambda"></a>

## initWrapConsumerHandlerForAWSLambda(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with a consumer AWS Lambda.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The service dependencies |
| services.ENV | <code>Object</code> |  | The process environment |
| services.MAIN_DEFINITION | <code>Object</code> |  | An OpenAPI definition for that handler |
| services.apm | <code>Object</code> |  | An application monitoring service |
| [services.time] | <code>Object</code> |  | An optional time service |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initWrapCronHandlerForAWSLambda"></a>

## initWrapCronHandlerForAWSLambda(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with cron AWS Lambda.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The service dependencies |
| services.ENV | <code>Object</code> |  | The process environment |
| services.MAIN_DEFINITION | <code>Object</code> |  | An OpenAPI definition for that handler |
| services.apm | <code>Object</code> |  | An application monitoring service |
| [services.time] | <code>Object</code> |  | An optional time service |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initWrapKafkaConsumerHandlerForAWSLambda"></a>

## initWrapKafkaConsumerHandlerForAWSLambda(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with a kafka AWS Lambda.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The service dependencies |
| services.ENV | <code>Object</code> |  | The process environment |
| services.MAIN_DEFINITION | <code>Object</code> |  | An OpenAPI definition for that handler |
| services.apm | <code>Object</code> |  | An application monitoring service |
| [services.time] | <code>Object</code> |  | An optional time service |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initWrapLogSubscriberHandlerForAWSLambda"></a>

## initWrapLogSubscriberHandlerForAWSLambda(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with a log subscriber AWS Lambda.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The service dependencies |
| services.ENV | <code>Object</code> |  | The process environment |
| services.MAIN_DEFINITION | <code>Object</code> |  | An OpenAPI definition for that handler |
| services.apm | <code>Object</code> |  | An application monitoring service |
| [services.time] | <code>Object</code> |  | An optional time service |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initWrapRouteHandlerForAWSLambda"></a>

## initWrapRouteHandlerForAWSLambda(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with a route AWS Lambda.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The service dependencies |
| services.MAIN_DEFINITION | <code>Object</code> |  | An OpenAPI definition for that handler |
| services.ENV | <code>Object</code> |  | The process environment |
| services.DECODERS | <code>Object</code> |  | Request body decoders available |
| services.ENCODERS | <code>Object</code> |  | Response body encoders available |
| services.PARSED_HEADERS | <code>Object</code> |  | A list of headers that should be parsed as JSON |
| services.PARSERS | <code>Object</code> |  | Request body parsers available |
| services.STRINGIFIERS | <code>Object</code> |  | Response body stringifiers available |
| services.BUFFER_LIMIT | <code>Object</code> |  | The buffer size limit |
| services.apm | <code>Object</code> |  | An application monitoring service |
| services.obfuscator | <code>Object</code> |  | A service to hide sensible values |
| services.errorHandler | <code>Object</code> |  | A service that changes any error to Whook response |
| [services.time] | <code>Object</code> |  | An optional time service |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initWrapS3HandlerForAWSLambda"></a>

## initWrapS3HandlerForAWSLambda(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with a S3 AWS Lambda.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The service dependencies |
| services.ENV | <code>Object</code> |  | The process environment |
| services.MAIN_DEFINITION | <code>Object</code> |  | A consumer definition for that handler |
| services.apm | <code>Object</code> |  | An application monitoring service |
| [services.time] | <code>Object</code> |  | An optional time service |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initWrapTransformerHandlerForAWSLambda"></a>

## initWrapTransformerHandlerForAWSLambda(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with a transformer AWS Lambda.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The service dependencies |
| services.ENV | <code>Object</code> |  | The process environment |
| services.MAIN_DEFINITION | <code>Object</code> |  | A transformer definition for that handler |
| services.apm | <code>Object</code> |  | An application monitoring service |
| [services.time] | <code>Object</code> |  | An optional time service |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

