import {
  describe,
  expect,
  jest,
  test,
  afterEach,
} from '@jest/globals';
import { constant, initializer, type Knifecycle } from 'knifecycle';
import {
  getPingDefinition,
  prepareEnvironment as prepareBaseEnvironment,
  prepareProcess,
  runProcess,
  initHTTPRouter,
  initHTTPTransaction,
  initRoutesHandlers,
  initCronsHandlers,
  initConsumersHandlers,
  type WhookRouteHandler,
  type WhookRouteHandlerParameters,
  type WhookDefinitions,
  type WhookCronHandler,
  type WhookConsumerHandler,
} from '@whook/whook';
import axios from 'axios';
import { type OpenAPI } from 'ya-open-api-types';
import { YError } from 'yerror';
import { type Logger } from 'common-services';
import {
  type Attributes,
  type Span,
  type SpanContext,
  type SpanStatus,
  type Tracer,
} from '@opentelemetry/api';
import { type JsonValue } from 'type-fest';
import {
  wrapHTTPRouterWithOTel,
  wrapHTTPTransactionWithOTel,
  wrapRoutesHandlersWithOTel,
  wrapCronsHandlersWithOTel,
  wrapConsumersHandlersWithOTel,
} from './index.js';

type SpanRecord = {
  name: string;
  attributes: Record<string, unknown>;
  events: {
    name: string;
    attributes?: Attributes;
  }[];
  statuses: SpanStatus[];
  exceptions: unknown[];
  ended: boolean;
};

function createTracerRecorder(): {
  tracer: Tracer;
  spans: SpanRecord[];
} {
  const spans: SpanRecord[] = [];

  return {
    spans,
    tracer: {
      startSpan: (name: string, options?: { attributes?: Attributes }) => {
        const spanRecord: SpanRecord = {
          name,
          attributes: options?.attributes ? { ...options.attributes } : {},
          events: [],
          statuses: [],
          exceptions: [],
          ended: false,
        };
        const fakeSpanContext: SpanContext = {
          traceId: '0'.repeat(32),
          spanId: '0'.repeat(16),
          traceFlags: 1,
        };
        const span = {
          spanContext: () => fakeSpanContext,
          setAttribute: (key: string, value: unknown) => {
            spanRecord.attributes[key] = value;
            return span;
          },
          setAttributes: (attributes: Attributes) => {
            Object.assign(spanRecord.attributes, attributes);
            return span;
          },
          addEvent: (name: string, attributes?: Attributes) => {
            spanRecord.events.push({
              name,
              attributes,
            });
            return span;
          },
          setStatus: (status: SpanStatus) => {
            spanRecord.statuses.push(status);
            return span;
          },
          updateName: () => span,
          end: () => {
            spanRecord.ended = true;
            return span;
          },
          isRecording: () => true,
          recordException: (exception: unknown) => {
            spanRecord.exceptions.push(exception);
            return span;
          },
        } as unknown as Span;

        spans.push(spanRecord);

        return span;
      },
      startActiveSpan: async (...args: unknown[]) => {
        void args;
        throw new Error('Not implemented in test tracer.');
      },
    } as unknown as Tracer,
  };
}

describe('@whook/otel', () => {
  let $instance: Knifecycle | undefined;

  afterEach(async () => {
    if ($instance) {
      await $instance.destroy();
      $instance = undefined;
    }
  });

  test('should instrument the HTTP router and transaction lifecycle', async () => {
    const BASE_PATH = '/v1';
    const PORT = 16666;
    const HOST = 'localhost';
    const tracerRecorder = createTracerRecorder();
    const API: OpenAPI = {
      openapi: '3.1.0',
      info: {
        version: '1.0.0',
        title: 'Sample OpenAPI',
        description: 'A sample OpenAPI file for testing purpose.',
      },
      paths: {
        [`${BASE_PATH}${getPingDefinition.path}`]: {
          [getPingDefinition.method]: getPingDefinition.operation,
        },
      },
    };
    const DEFINITIONS: WhookDefinitions = {
      components: {},
      paths: {
        [getPingDefinition.path]: {
          [getPingDefinition.method]: getPingDefinition.operation,
        },
      },
      security: [],
      configs: {
        getPing: {
          type: 'route',
          path: getPingDefinition.path,
          method: getPingDefinition.method,
          config: {},
          operation: getPingDefinition.operation,
        },
      },
    };
    const getPing = jest.fn<WhookRouteHandler>();
    const logger = {
      output: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    const $autoload = jest.fn(async (serviceName) => {
      throw new YError('E_UNMATCHED_DEPENDENCY', [serviceName as string]);
    });

    getPing.mockResolvedValueOnce({
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: {
        ping: 'pong',
      },
    });

    async function prepareEnvironment() {
      const $ = await prepareBaseEnvironment();

      $.register(wrapRoutesHandlersWithOTel(initRoutesHandlers));
      $.register(wrapHTTPTransactionWithOTel(initHTTPTransaction));
      $.register(wrapHTTPRouterWithOTel(initHTTPRouter));
      $.register(
        initializer(
          {
            name: '$autoload',
            type: 'service',
            singleton: true,
          },
          async () => $autoload,
        ),
      );
      $.register(constant('BASE_PATH', BASE_PATH));
      $.register(constant('API', API));
      $.register(constant('DEFINITIONS', DEFINITIONS));
      $.register(constant('APP_ENV', 'local'));
      $.register(
        constant('ENV', {
          NODE_ENV: 'test',
        }),
      );
      $.register(constant('PORT', PORT));
      $.register(constant('HOST', HOST));
      $.register(constant('ROUTES_WRAPPERS_NAMES', []));
      $.register(constant('DEBUG_NODE_ENVS', []));
      $.register(
        constant('ROUTES_HANDLERS', {
          getPing,
        }),
      );
      $.register(constant('logger', logger as Logger));
      $.register(constant('otelTracer', tracerRecorder.tracer));

      return $;
    }

    const runProcessResult = await runProcess<{
      $instance: Knifecycle;
    }>(prepareEnvironment, prepareProcess, ['$instance', 'httpServer', 'process']);

    $instance = runProcessResult.$instance;

    const { status } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}/ping`,
      headers: {
        'user-agent': '__avoid_axios_version__',
      },
      validateStatus: () => true,
    });

    expect(status).toBe(200);

    const spansByName = tracerRecorder.spans.reduce(
      (spansIndex, span) => {
        spansIndex[span.name] = spansIndex[span.name] || [];
        spansIndex[span.name].push(span);
        return spansIndex;
      },
      {} as Record<string, SpanRecord[]>,
    );

    expect(Object.keys(spansByName)).toEqual(
      expect.arrayContaining([
        'whook.http.router',
        'whook.http.transaction',
      ]),
    );

    const [routerSpan] = spansByName['whook.http.router'];

    expect(routerSpan.events.map((event) => event.name)).toEqual(
      expect.arrayContaining([
        'whook.router.routing.started',
        'whook.router.parsing.completed',
        'whook.router.execution.completed',
        'whook.router.transfer.completed',
      ]),
    );

    const transferEvent = routerSpan.events.find(
      (event) => event.name === 'whook.router.transfer.completed',
    );

    expect(typeof transferEvent?.attributes?.duration_ms).toBe('number');
    expect(routerSpan.ended).toBe(true);
  });

  test('should instrument route handlers executions', async () => {
    const tracerRecorder = createTracerRecorder();
    const testRoute = jest.fn<WhookRouteHandler>();

    testRoute.mockResolvedValueOnce({ status: 200 });

    const wrappedRoutesHandlersInitializer = wrapRoutesHandlersWithOTel(
      initRoutesHandlers,
    );
    const ROUTES_HANDLERS = await wrappedRoutesHandlersInitializer({
      ROUTES_WRAPPERS: [],
      otelTracer: tracerRecorder.tracer,
      testRoute,
    } as unknown as NonNullable<
      Parameters<typeof wrappedRoutesHandlersInitializer>[0]
    >);
    const routeParams: WhookRouteHandlerParameters = {
      headers: {},
      query: {},
      path: {},
      cookies: {},
      body: undefined as never,
    };

    await ROUTES_HANDLERS.testRoute(routeParams);

    expect(tracerRecorder.spans).toHaveLength(1);
    expect(tracerRecorder.spans[0].name).toBe('whook.http.execution');
    expect(tracerRecorder.spans[0].attributes['whook.operation.id']).toBe(
      'testRoute',
    );
    expect(tracerRecorder.spans[0].ended).toBe(true);
  });

  test('should instrument cron handlers executions', async () => {
    const tracerRecorder = createTracerRecorder();
    const testCron = jest.fn<WhookCronHandler<JsonValue>>();

    testCron.mockResolvedValueOnce();

    const wrappedCronsHandlersInitializer = wrapCronsHandlersWithOTel(
      initCronsHandlers,
    );
    const CRONS_HANDLERS = await wrappedCronsHandlersInitializer({
      CRONS_WRAPPERS: [],
      otelTracer: tracerRecorder.tracer,
      testCron,
    } as unknown as NonNullable<
      Parameters<typeof wrappedCronsHandlersInitializer>[0]
    >);

    await CRONS_HANDLERS.testCron(
      {
        date: new Date('2026-01-01T00:00:00.000Z').toISOString(),
        body: {
          ping: 'pong',
        },
      },
      {
        name: 'testCron',
        schedules: [],
        schema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
    );

    expect(tracerRecorder.spans).toHaveLength(1);
    expect(tracerRecorder.spans[0].name).toBe('whook.cron.execution');
    expect(tracerRecorder.spans[0].attributes['whook.cron.name']).toBe(
      'testCron',
    );
    expect(tracerRecorder.spans[0].ended).toBe(true);
  });

  test('should instrument consumer handlers executions', async () => {
    const tracerRecorder = createTracerRecorder();
    const testConsumer = jest.fn<WhookConsumerHandler<JsonValue>>();

    testConsumer.mockResolvedValueOnce();

    const wrappedConsumersHandlersInitializer = wrapConsumersHandlersWithOTel(
      initConsumersHandlers,
    );
    const CONSUMERS_HANDLERS = await wrappedConsumersHandlersInitializer({
      CONSUMERS_WRAPPERS: [],
      otelTracer: tracerRecorder.tracer,
      testConsumer,
    } as unknown as NonNullable<
      Parameters<typeof wrappedConsumersHandlersInitializer>[0]
    >);

    await CONSUMERS_HANDLERS.testConsumer(
      {
        ping: 'pong',
      },
      {
        name: 'testConsumer',
        schema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
    );

    expect(tracerRecorder.spans).toHaveLength(1);
    expect(tracerRecorder.spans[0].name).toBe('whook.consumer.execution');
    expect(tracerRecorder.spans[0].attributes['whook.consumer.name']).toBe(
      'testConsumer',
    );
    expect(tracerRecorder.spans[0].ended).toBe(true);
  });
});
