# API
## Functions

<dl>
<dt><a href="#initWrapHandlerForConsumerLambda">initWrapHandlerForConsumerLambda(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap an handler to make it work with a consumer AWS Lambda.</p>
</dd>
<dt><a href="#initWrapHandlerForCronLambda">initWrapHandlerForCronLambda(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap an handler to make it work with cron AWS Lambda.</p>
</dd>
<dt><a href="#initWrapHandlerForConsumerLambda">initWrapHandlerForConsumerLambda(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap an handler to make it work with a consumer AWS Lambda.</p>
</dd>
<dt><a href="#initWrapHandlerForKafkaLambda">initWrapHandlerForKafkaLambda(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap an handler to make it work with a kafka AWS Lambda.</p>
</dd>
<dt><a href="#initWrapHandlerForLogSubscriberLambda">initWrapHandlerForLogSubscriberLambda(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap an handler to make it work with a log subscriber AWS Lambda.</p>
</dd>
<dt><a href="#initWrapHandlerForS3Lambda">initWrapHandlerForS3Lambda(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap an handler to make it work with a S3 AWS Lambda.</p>
</dd>
<dt><a href="#initWrapHandlerForConsumerLambda">initWrapHandlerForConsumerLambda(services)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Wrap an handler to make it work with a transformer AWS Lambda.</p>
</dd>
</dl>

<a name="initWrapHandlerForConsumerLambda"></a>

## initWrapHandlerForConsumerLambda(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with a consumer AWS Lambda.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services the wrapper depends on |
| services.ENV | <code>Object</code> |  | The process environment |
| services.MAIN_DEFINITION | <code>Object</code> |  | An OpenAPI definitition for that handler |
| services.apm | <code>Object</code> |  | An application monitoring service |
| [services.time] | <code>Object</code> |  | An optional time service |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initWrapHandlerForCronLambda"></a>

## initWrapHandlerForCronLambda(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with cron AWS Lambda.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services the wrapper depends on |
| services.ENV | <code>Object</code> |  | The process environment |
| services.MAIN_DEFINITION | <code>Object</code> |  | An OpenAPI definitition for that handler |
| services.apm | <code>Object</code> |  | An application monitoring service |
| [services.time] | <code>Object</code> |  | An optional time service |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initWrapHandlerForConsumerLambda"></a>

## initWrapHandlerForConsumerLambda(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with a consumer AWS Lambda.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services the wrapper depends on |
| services.MAIN_DEFINITION | <code>Object</code> |  | An OpenAPI definitition for that handler |
| services.ENV | <code>Object</code> |  | The process environment |
| services.DECODERS | <code>Object</code> |  | Request body decoders available |
| services.ENCODERS | <code>Object</code> |  | Response body encoders available |
| services.PARSED_HEADERS | <code>Object</code> |  | A list of headers that should be parsed as JSON |
| services.PARSERS | <code>Object</code> |  | Request body parsers available |
| services.STRINGIFYERS | <code>Object</code> |  | Response body stringifyers available |
| services.BUFFER_LIMIT | <code>Object</code> |  | The buffer size limit |
| services.apm | <code>Object</code> |  | An application monitoring service |
| services.obfuscator | <code>Object</code> |  | A service to hide sensible values |
| services.errorHandler | <code>Object</code> |  | A service that changes any error to Whook response |
| [services.time] | <code>Object</code> |  | An optional time service |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initWrapHandlerForKafkaLambda"></a>

## initWrapHandlerForKafkaLambda(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with a kafka AWS Lambda.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services the wrapper depends on |
| services.ENV | <code>Object</code> |  | The process environment |
| services.MAIN_DEFINITION | <code>Object</code> |  | An OpenAPI definitition for that handler |
| services.apm | <code>Object</code> |  | An application monitoring service |
| [services.time] | <code>Object</code> |  | An optional time service |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initWrapHandlerForLogSubscriberLambda"></a>

## initWrapHandlerForLogSubscriberLambda(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with a log subscriber AWS Lambda.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services the wrapper depends on |
| services.ENV | <code>Object</code> |  | The process environment |
| services.MAIN_DEFINITION | <code>Object</code> |  | An OpenAPI definitition for that handler |
| services.apm | <code>Object</code> |  | An application monitoring service |
| [services.time] | <code>Object</code> |  | An optional time service |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initWrapHandlerForS3Lambda"></a>

## initWrapHandlerForS3Lambda(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with a S3 AWS Lambda.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services the wrapper depends on |
| services.ENV | <code>Object</code> |  | The process environment |
| services.MAIN_DEFINITION | <code>Object</code> |  | An OpenAPI definitition for that handler |
| services.apm | <code>Object</code> |  | An application monitoring service |
| [services.time] | <code>Object</code> |  | An optional time service |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

<a name="initWrapHandlerForConsumerLambda"></a>

## initWrapHandlerForConsumerLambda(services) ⇒ <code>Promise.&lt;Object&gt;</code>
Wrap an handler to make it work with a transformer AWS Lambda.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise of an object containing the reshaped env vars.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| services | <code>Object</code> |  | The services the wrapper depends on |
| services.ENV | <code>Object</code> |  | The process environment |
| services.MAIN_DEFINITION | <code>Object</code> |  | An OpenAPI definitition for that handler |
| services.apm | <code>Object</code> |  | An application monitoring service |
| [services.time] | <code>Object</code> |  | An optional time service |
| [services.log] | <code>Object</code> | <code>noop</code> | An optional logging service |

