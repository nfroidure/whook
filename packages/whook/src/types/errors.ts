import { type ErrorObject } from 'ajv';

/**
 * Global Error Registry for Whook
 */
declare module 'yerror' {
  interface YErrorRegistry {
    /**
     * Thrown when commands arguments are bad
     * @param error the AJV errors encountered
     */
    E_BAD_ARG: [error: ErrorObject<string, Record<string, unknown>, unknown>[]];

    /**
     * Thrown when no command name is provided in CLI arguments
     */
    E_NO_COMMAND_NAME: [];

    /**
     * Thrown when a command name is not found in available commands
     * @param commandName the name of the command that was not found
     */
    E_BAD_COMMAND_NAME: [commandName: string];

    /**
     * Thrown when a command module has no default export (handler)
     * @param commandName the name of the command
     */
    E_NO_COMMAND_HANDLER: [commandName: string];

    /**
     * Thrown when a command module has no definition export
     * @param commandName the name of the command
     */
    E_NO_COMMAND_DEFINITION: [commandName: string];

    /**
     * Thrown when a dependency cannot be resolved during auto-loading
     * @param injectedName the name of the dependency that could not be found
     */
    E_UNMATCHED_DEPENDENCY: [injectedName: string, ...parents: string[]];

    /**
     * Thrown when an OpenAPI path item is invalid (undefined or has $ref)
     * @param path the OpenAPI path
     * @param pathItem the invalid path item
     */
    E_BAD_PATH_ITEM: [path: string, pathItem: unknown];

    /**
     * Thrown when an OpenAPI operation is invalid (has $ref or no operationId)
     * @param path the OpenAPI path
     * @param method the HTTP method
     * @param operation the invalid operation
     */
    E_BAD_OPERATION: [path: string, method: string, operation: unknown] | [];

    /**
     * Thrown when trying to invoke a route while the route invoker is disposing
     */
    E_DISPOSING: [];

    /**
     * Thrown when a configuration value is not found
     * @param name the configuration name
     */
    E_NO_CONFIG: [name: string];

    /**
     * Thrown when a query on a config/service does not return results
     * @param name the config/service name
     * @param query the query string used
     */
    E_NO_RESULT: [name: string, query?: string];

    /**
     * Thrown when a handler name does not match the required patterns
     * @param finalName the handler name
     * @param patterns the regex patterns it should match
     */
    E_BAD_HANDLER_NAME: [finalName: string, patterns: string[]];

    /**
     * Thrown when an unexpected type is encountered in the create command
     */
    E_UNEXPECTED_TYPE: [];

    /**
     * Thrown when a service cannot be found during inspection
     * @param name the service name
     */
    E_NO_SERVICE_FOUND: [name: string];

    /**
     * Thrown when an environment variable is not found
     * @param name the environment variable name
     */
    E_NO_ENV_VALUE: [name: string];

    /**
     * Thrown when a security scheme is referenced but not declared in OpenAPI
     * @param schemeKey the security scheme key
     * @param operationId the operation ID referencing the scheme
     */
    E_UNDECLARED_SECURITY_SCHEME: [schemeKey: string];

    /**
     * Thrown when an unsupported HTTP authentication scheme is used
     * @param scheme the HTTP scheme
     */
    E_UNSUPPORTED_HTTP_SCHEME: [scheme: string];

    /**
     * Thrown when an API key source is not supported (e.g., cookie)
     * @param source the API key source
     * @param name the parameter name
     */
    E_UNSUPPORTED_API_KEY_SOURCE: [source: string, name: string];

    /**
     * Thrown when a parameter has an invalid name
     * @param parameter the parameter object
     */
    E_BAD_PARAMETER_NAME: [parameter: unknown];

    /**
     * Thrown when a parameter definition uses unsupported features
     * @param name the parameter name
     * @param reason the reason it's unsupported
     * @param value the unsupported value
     */
    E_UNSUPPORTED_PARAMETER_DEFINITION: [
      name: string,
      reason: string,
      value?: string,
    ];

    /**
     * Thrown when a parameter is defined without a schema
     * @param name the parameter name
     */
    E_PARAMETER_WITHOUT_SCHEMA: [name: string];

    /**
     * Thrown when a schema type is not supported
     * @param schema the unsupported schema
     */
    E_UNSUPPORTED_SCHEMA: [schema: unknown];

    /**
     * Thrown when a parameter schema type is not supported
     * @param schema the unsupported schema
     */
    E_UNSUPPORTED_PARAMETER_SCHEMA: [schema: unknown];

    /**
     * Thrown when a parameter schema validation fails
     * @param name the parameter name
     */
    E_BAD_PARAMETER_SCHEMA: [name: string];

    /**
     * Thrown when a request body schema is invalid
     * @param operationId the operation ID
     * @param mediaType the media type
     */
    E_BAD_BODY_SCHEMA: [operationId: string, mediaType: string];

    /**
     * Thrown when a required request body is missing
     * @param operationId the operation ID
     * @param bodyType the type of the body
     * @param body the body value
     */
    E_REQUIRED_REQUEST_BODY: [
      operationId: string,
      bodyType: string,
      body: unknown,
    ];

    /**
     * Thrown when the request body fails validation
     * @param operationId the operation ID
     * @param bodyType the type of the body
     * @param body the body value
     * @param errors the validation errors
     */
    E_BAD_REQUEST_BODY: [
      operationId: string,
      bodyType: string,
      body: unknown,
      errors: unknown,
    ];

    /**
     * Thrown when a request body is provided but not expected
     * @param operationId the operation ID
     * @param bodyType the type of the body
     * @param body the body value
     */
    E_NO_REQUEST_BODY: [operationId: string, bodyType: string, body: unknown];
  }
}
