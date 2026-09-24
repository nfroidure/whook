import {
  context,
  SpanKind,
  SpanStatusCode,
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
import { type WhookOTelTracerService } from '../services/oTelTracer.js';

export interface WhookOTelRouteHandlersDependencies {
  oTelTracer: WhookOTelTracerService;
  log?: LogService;
}

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
  >(['oTelTracer', '?log'], initRoutesHandlers);

  return wrapInitializer(
    async (
      { oTelTracer, log = noop }: WhookOTelRouteHandlersDependencies,
      ROUTES_HANDLERS: WhookRoutesHandlersService,
    ) => {
      log('warning', '📈 - Wrapping route handlers with OpenTelemetry spans.');

      // Remove bad handler due to additional service injection
      delete ROUTES_HANDLERS.oTelTracer;

      const wrappedRoutesHandlers: WhookRoutesHandlersService = {};

      for (const [operationId, routeHandler] of Object.entries(
        ROUTES_HANDLERS,
      )) {
        wrappedRoutesHandlers[operationId] = wrapRouteHandler(
          {
            operationId,
            oTelTracer,
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
    oTelTracer,
  }: {
    operationId: string;
    oTelTracer: WhookOTelTracerService;
  },
  routeHandler: WhookRouteHandler,
): WhookRouteHandler {
  return async (...args: Parameters<WhookRouteHandler>) => {
    const requestContext = getRequestContext();
    const parentContext = requestContext?.transactionSpan
      ? trace.setSpan(context.active(), requestContext.transactionSpan)
      : context.active();
    const span = oTelTracer.startSpan(
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
      const result = await context.with(spanContext, () =>
        routeHandler(...args),
      );

      span.setStatus({
        code: SpanStatusCode.OK,
      });

      return result;
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (err as Error)?.message,
      });
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
