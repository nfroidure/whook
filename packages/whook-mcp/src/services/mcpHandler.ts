import {
  type WhookAuthenticationData,
  type WhookAuthenticationScope,
} from '@whook/authorization';
import {
  DEFAULT_DEBUG_NODE_ENVS,
  type WhookDefinitions,
  type WhookOpenAPI,
  type WhookOpenAPIOperation,
  type WhookRouteConfig,
  type WhookRouteHandlerParameters,
  type WhookRoutesHandlersService,
  type WhookSchemaValidatorsService,
} from '@whook/whook';

import {
  Server,
  type Tool,
  createMcpHandler,
} from '@modelcontextprotocol/server';
import { type LogService } from 'common-services';
import { type Provider, autoProvider, name, location } from 'knifecycle';
import { Readable } from 'node:stream';
import {
  type ObjectJSONSchema,
  type ExpressiveJSONSchema,
  type JSONSchema,
} from 'ya-json-schema-types';
import { type AppEnvVars, type NodeEnv } from 'application-services';
import {
  OpenAPIExtension,
  type OpenAPIMethod,
  OpenAPIParameter,
  type OpenAPISecurityRequirement,
  ensureResolvedObject,
} from 'ya-open-api-types';
import { YError, printStackTrace } from 'yerror';

const PARAMETERS_LOCATION: Record<
  OpenAPIParameter<unknown, OpenAPIExtension>['in'],
  keyof WhookRouteHandlerParameters
> = {
  cookie: 'cookies',
  header: 'headers',
  path: 'path',
  query: 'query',
  querystring: 'query',
};

export type WhookMCPHandlerService = ReturnType<typeof createMcpHandler>;

export interface WhookMCPRouteConfig {
  allowMCP?: boolean;
}
export interface WhookMCPOptions {
  /** MCP server advertised metadata */
  metadata: {
    name: string;
    version: `${string}.${string}.${string}`;
    websiteUrl?: string;
    title?: string;
    description?: string;
    icons?: {
      src: string;
      mimeType?: string;
      sizes?: string[];
      theme?: 'light' | 'dark';
    }[];
  };
  /** The MCP server path */
  path: `/${string}`;
  /** Allows to prebuild definitions at startup (default: false) */
  prebuildTools: boolean;
  /** Security requirements keys to check
   * (leave the array empty to provide anonymous routes only)
   */
  securityKeys: string[];
  /** Rules to choose operation to provide
   * (all routes are provided per default)
   */
  rules?:
    | {
        /** Use a static list of operations to allow/block */
        mode: 'allowlist' | 'blocklist';
        operationsIds: string[];
      }
    /** Use routes configuration */
    | {
        mode: 'config';
        default: 'allow' | 'block';
      }
    | {
        /** Use a function to filter operations to allow */
        mode: 'filter';
        operationIsAllowed: (operationId: string) => boolean;
      };
}
export interface WhookMCPHandlerConfig {
  MCP_OPTIONS: WhookMCPOptions;
}
export type WhookMCPHandlerDependencies = WhookMCPHandlerConfig & {
  DEBUG_NODE_ENVS?: NodeEnv[];
  ENV: AppEnvVars;
  API: WhookOpenAPI;
  ROUTES_HANDLERS: WhookRoutesHandlersService;
  DEFINITIONS: WhookDefinitions;
  schemaValidators: WhookSchemaValidatorsService;
  log: LogService;
};

async function initMCPHandler({
  DEBUG_NODE_ENVS = DEFAULT_DEBUG_NODE_ENVS,
  ENV,
  API,
  ROUTES_HANDLERS,
  DEFINITIONS,
  schemaValidators,
  MCP_OPTIONS,
  log,
}: WhookMCPHandlerDependencies): Promise<Provider<WhookMCPHandlerService>> {
  log('warning', `💻 - Starting the MCPServer service.`);

  const toolsCache: Record<string, Tool | 'skipped'> = {};

  if (MCP_OPTIONS.prebuildTools) {
    log('debug', `🔧 - Pre-building tools!`);
    for (const [operationId, config] of Object.entries(DEFINITIONS.configs)) {
      if (config.type !== 'route' || config.method === 'options') {
        continue;
      }

      const operation = config.operation;

      if (!operation) {
        log('debug', `🤷 - Filtering undefined "${operationId}" operation!`);
        continue;
      }

      const tool = await buildTool(operation, config.method, config.config);

      if (tool !== 'skipped') {
        schemaValidators(tool.inputSchema, `mcp:${operationId}:input`);
        if (DEBUG_NODE_ENVS.includes(ENV.NODE_ENV) && tool.outputSchema) {
          schemaValidators(tool.outputSchema, `mcp:${operationId}:output`);
        }
      }
    }
  }

  async function buildTool(
    operation: WhookOpenAPIOperation,
    method: OpenAPIMethod,
    config?: WhookRouteConfig,
  ) {
    const operationId = operation.operationId;

    if (toolsCache[operationId]) {
      return toolsCache[operationId];
    }

    log('debug', `🔧 - Building tool for ${operationId}!`);

    if (
      MCP_OPTIONS.rules &&
      ((MCP_OPTIONS.rules.mode === 'allowlist' &&
        !MCP_OPTIONS.rules.operationsIds.includes(operationId)) ||
        (MCP_OPTIONS.rules.mode === 'blocklist' &&
          MCP_OPTIONS.rules.operationsIds.includes(operationId)) ||
        (MCP_OPTIONS.rules.mode === 'config' &&
          (config?.allowMCP === false ||
            (config?.allowMCP !== true &&
              MCP_OPTIONS.rules.default === 'block'))) ||
        (MCP_OPTIONS.rules.mode === 'filter' &&
          !MCP_OPTIONS.rules.operationIsAllowed(operationId)))
    ) {
      log(
        'debug',
        `🤷 - Filtering "${operationId}" operation (mode: "${MCP_OPTIONS.rules?.mode}")!`,
      );
      toolsCache[operationId] = 'skipped';
      return toolsCache[operationId];
    }

    const responsesSchemas: JSONSchema[] = [];

    for (const statusCode of Object.keys(operation.responses || {})) {
      const maybeResponse = operation.responses?.[statusCode];
      const response = await ensureResolvedObject(API, maybeResponse);

      if (!response || !('content' in response) || !response.content) {
        continue;
      }

      const schema = response.content?.['application/json']?.schema || {
        type: 'string',
        format: 'binary',
      };

      responsesSchemas.push({
        type: 'object',
        required: ['status', 'body'],
        properties: {
          status:
            statusCode === 'default' || !/^\d{3}$/.test(statusCode)
              ? { type: 'number' }
              : { const: parseInt(statusCode, 10) },
          body: schema,
        },
      });
    }

    const parameters = await Promise.all(
      (operation.parameters || []).map((parameter) =>
        ensureResolvedObject(API, parameter),
      ),
    );
    const requestBody = operation.requestBody
      ? await ensureResolvedObject(API, operation.requestBody)
      : undefined;
    const bodySchema = requestBody
      ? requestBody.content?.['application/json']?.schema || {
          type: 'string',
          format: 'binary',
        }
      : undefined;

    const tool: Tool = {
      name: operationId,
      description: operation.summary || '',
      annotations: {
        readOnlyHint: !['put', 'post', 'patch', 'delete'].includes(method),
        idempotentHint: [
          'options',
          'head',
          'get',
          'query',
          'put',
          'delete',
        ].includes(method),
        destructiveHint: ['put', 'post', 'patch', 'delete'].includes(method),
        openWorldHint: true,
      },
      inputSchema: {
        type: 'object',
        required: [
          ...new Set(
            parameters
              .filter((parameter) => parameter.required)
              .map((parameter) => PARAMETERS_LOCATION[parameter.in]),
          ),
          ...(requestBody?.required ? ['body'] : []),
        ],
        properties: parameters.reduce(
          (properties, parameter) => ({
            ...properties,
            [PARAMETERS_LOCATION[parameter.in]]:
              parameter.in === 'querystring'
                ? 'schema' in parameter
                  ? (parameter.schema as ExpressiveJSONSchema)
                  : true
                : ({
                    type: 'object',
                    required: [
                      ...new Set(
                        (
                          (
                            properties[
                              PARAMETERS_LOCATION[parameter.in]
                            ] as ObjectJSONSchema
                          )?.required || []
                        ).concat(parameter.required ? [parameter.name] : []),
                      ),
                    ],
                    properties: {
                      ...((
                        properties[
                          PARAMETERS_LOCATION[parameter.in]
                        ] as ObjectJSONSchema
                      )?.properties || {}),
                      [parameter.name]:
                        'schema' in parameter
                          ? {
                              description: parameter.description,
                              ...parameter.schema,
                            }
                          : true,
                    },
                  } as ExpressiveJSONSchema),
          }),
          (bodySchema
            ? {
                body: bodySchema,
              }
            : {}) as NonNullable<ObjectJSONSchema['properties']>,
        ),
      } as unknown as Tool['inputSchema'],
      outputSchema:
        responsesSchemas.length === 1
          ? (responsesSchemas[0] as ExpressiveJSONSchema)
          : responsesSchemas.length
            ? { oneOf: responsesSchemas }
            : undefined,
    };

    toolsCache[operation.operationId] = tool;

    return tool;
  }

  function checkSecurityScopes(
    scopes: WhookAuthenticationScope[],
    security?: OpenAPISecurityRequirement[],
  ): boolean {
    if (!security || Object.keys(security).length === 0) {
      return true;
    }

    for (const securityKey of MCP_OPTIONS.securityKeys || []) {
      for (const requirement of security) {
        if (
          Object.keys(requirement).length === 1 &&
          requirement[securityKey] &&
          requirement[securityKey].every((scope) =>
            scopes.includes(scope as WhookAuthenticationScope),
          )
        ) {
          return true;
        }
      }
    }
    return false;
  }

  const handler = createMcpHandler(({ requestInfo, authInfo }) => {
    const server = new Server(MCP_OPTIONS.metadata, {
      capabilities: { tools: {} },
    });
    const authenticationData = authInfo as unknown as WhookAuthenticationData;

    log(
      'debug',
      `🙋 - MCP authentication: `,
      JSON.stringify(authenticationData) || 'anonymous',
    );

    server.setRequestHandler('tools/list', async () => {
      try {
        log('debug', '➕ - Listing tools!');

        const scopes = authenticationData?.scopes || [];
        const tools: Tool[] = [];

        for (const [operationId, config] of Object.entries(
          DEFINITIONS.configs,
        )) {
          if (config.type !== 'route' || config.method === 'options') {
            continue;
          }

          const operation = config.operation;

          if (!operation) {
            log(
              'debug',
              `🤷 - Filtering undefined "${operationId}" operation!`,
            );
            continue;
          }

          if (
            !checkSecurityScopes(scopes, operation.security ?? API.security)
          ) {
            log(
              'debug',
              `🤷 - Not supposed to run "${operationId}" with scopes "${scopes.join(' ')}"!`,
            );
            continue;
          }

          const tool = await buildTool(operation, config.method, config.config);

          if (tool !== 'skipped') {
            tools.push(tool);
          }
        }

        log('debug', `➕ - Found ${tools.length} tools!`);

        return {
          tools,
        };
      } catch (err) {
        log('error', `❌ - Failed to list MCP tools!`);
        log('error-stack', printStackTrace(err));

        return {
          tools: [],
          isError: true,
        };
      }
    });

    server.setRequestHandler('tools/call', async (request) => {
      log('debug', `➕ - Running call ${request.params.name}!`);

      const handler = ROUTES_HANDLERS[request.params.name];
      const definition = DEFINITIONS.configs[request.params.name];
      const tool =
        definition?.type === 'route' && definition.operation
          ? await buildTool(
              definition.operation,
              definition.method,
              definition.config,
            )
          : undefined;

      if (
        !handler ||
        !definition ||
        definition.type !== 'route' ||
        !tool ||
        tool === 'skipped'
      ) {
        return {
          content: [
            { type: 'text', text: `Unknown tool: ${request.params.name}` },
          ],
          isError: true,
        };
      }

      if (
        !checkSecurityScopes(
          authInfo?.scopes || [],
          definition.operation?.security ?? API.security,
        )
      ) {
        return {
          content: [
            { type: 'text', text: `Unauthorized tool: ${request.params.name}` },
          ],
          isError: true,
        };
      }

      const parameters: WhookRouteHandlerParameters = {
        path: {},
        query: {},
        cookies: {},
        headers: {},
        ...(request.params.arguments as Partial<WhookRouteHandlerParameters>),
      };

      log('debug', `➕ - Parameters "${JSON.stringify(parameters)}"`);

      const validate = schemaValidators(
        tool.inputSchema,
        `mcp:${definition.operation.operationId}:input`,
      );

      validate(parameters);

      if (validate.errors) {
        return {
          content: [
            {
              type: 'text',
              text: `Bad parameters: ${JSON.stringify(validate.errors)}`,
              structuredContent: validate.errors,
            },
          ],
          isError: true,
        };
      }

      try {
        const response = await handler(
          {
            ...parameters,
            headers: {
              ...parameters.headers,
              authorization: requestInfo?.headers.get('authorization'),
            },
          },
          definition,
        );

        log('debug', `➕ - Response "${JSON.stringify(response)}"!`);

        if (DEBUG_NODE_ENVS.includes(ENV.NODE_ENV) && tool.outputSchema) {
          const validate = schemaValidators(
            tool.outputSchema,
            `mcp:${definition.operation.operationId}:output`,
          );

          validate(response);

          if (validate.errors) {
            log(
              'warning',
              `⚠️ - Response does not validate the output schema!`,
              JSON.stringify(response),
              JSON.stringify(validate.errors),
            );
          }
        }

        if (
          response.body instanceof Readable ||
          response.body instanceof Buffer
        ) {
          if (typeof response.headers?.['content-type'] === 'string') {
            const isImage =
              response.headers['content-type'].startsWith('image/');
            const isAudio =
              response.headers['content-type'].startsWith('audio/');
            const data =
              response.body instanceof Readable
                ? Buffer.concat(await response.body.toArray())
                : (response.body as Buffer);

            return {
              content: [
                isImage || isAudio
                  ? {
                      type: isImage ? 'image' : 'audio',
                      mimeType: response.headers['content-type'],
                      data: data.toString('base64'),
                    }
                  : {
                      type: 'resource',
                      resource: {
                        uri: 'blob:binary_file',
                        mimeType: response.headers['content-type'],
                        blob: data.toString('base64'),
                      },
                    },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Cannot encode resource.',
                },
              ],
              isError: true,
            };
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response),
              structuredContent: response,
            },
          ],
        };
      } catch (err) {
        log('error', `❌ - Unexpected MCP error!`);
        log('error-stack', printStackTrace(err));
        return {
          content: [
            {
              type: 'text',
              text: `Unexpected error: ${(err as YError).message}`,
            },
          ],
          isError: true,
        };
      }
    });

    return server;
  });

  return {
    service: handler,
    dispose: async () => {
      await handler.close();
    },
  };
}

export default location(
  name('mcpHandler', autoProvider(initMCPHandler)),
  import.meta.url,
);
