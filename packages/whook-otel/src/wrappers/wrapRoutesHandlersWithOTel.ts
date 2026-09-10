import {
  context,
  SpanKind,
  trace,
  type Context,
} from '@opentelemetry/api';
import {
  type WhookRouteHandler,
  type WhookRoutesHandlersService,
} from '@whook/whook';
import { noop, type LogService } from 'common-services';
import {
  alsoInject,
  wrapInitializer,
  type Dependencies,
  type ServiceInitializer,
} from 'knifecycle';
import { performance } from 'node:perf_hooks';
import { getRequestContext } from '../libs/requestTraceContext.js';
import { markSpanError } from '../libs/spans.js';
import { type WhookOTelTracerService } from '../services/otelTracer.js';

export type WhookOTelRouteHandlersDependencies = {
  otelTracer: WhookOTelTracerService;
  log?: LogService;
};

export default function wrapRoutesHandlersWithOTel<D extends Dependencies>(
  initRoutesHandlers: ServiceInitializer<D, WhookRoutesHandlersService>,
): ServiceInitializer<
  D & WhookOTelRouteHandlersDependencies,
  WhookRoutesHandlersService
> {
  const augmentedInitializer = alsoInject<
    WhookOTelRouteHandlersDependencies,
    D,
    WhookRoutesHandlersService
  >(['otelTracer', '?log'], initRoutesHandlers);

  return wrapInitializer(
    async (
      { otelTracer, log = noop }: WhookOTelRouteHandlersDependencies,
      ROUTES_HANDLERS: WhookRoutesHandlersService,
    ) => {
      log('warning', '📈 - Wrapping route handlers with OpenTelemetry spans.');

      const wrappedRoutesHandlers: WhookRoutesHandlersService = {};

      for (const [operationId, routeHandler] of Object.entries(ROUTES_HANDLERS)) {
        wrappedRoutesHandlers[operationId] = wrapRouteHandler(
          {
            operationId,
            otelTracer,
          },
          routeHandler,
        );
      }

      return wrappedRoutesHandlers;
    },
    augmentedInitializer,
  );
}

function wrapRouteHandler(
  {
    operationId,
    otelTracer,
  }: {
    operationId: string;
    otelTracer: WhookOTelTracerService;
  },
  routeHandler: WhookRouteHandler,
): WhookRouteHandler {
  return async (...args: Parameters<WhookRouteHandler>) => {
    const requestContext = getRequestContext();
    const parentContext = requestContext?.transactionSpan
      ? trace.setSpan(context.active(), requestContext.transactionSpan)
      : context.active();
    const span = otelTracer.startSpan(
      'whook.http.execution',
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'whook.operation.id': operationId,
        },
      },
      parentContext,
    );
    const spanContext: Context = trace.setSpan(parentContext, span);
    const executionStart = performance.now();

    try {
      return await context.with(spanContext, () => routeHandler(...args));
    } catch (err) {
      markSpanError(span, err);
      throw err;
    } finally {
      const executionDurationMs = performance.now() - executionStart;

      requestContext?.routerSpan?.addEvent(
        'whook.router.execution.handler.completed',
        {
          operation_id: operationId,
          duration_ms: executionDurationMs,
        },
      );

      if (requestContext) {
        requestContext.routeExecutionDurationMs += executionDurationMs;
      }

      span.setAttribute('whook.execution.duration_ms', executionDurationMs);
      span.end();
    }
  };
}
