import { context, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import {
  type WhookCronsHandlersService,
  type WhookCronHandler,
} from '@whook/whook';
import { noop, type LogService } from 'common-services';
import {
  alsoInject,
  wrapInitializer,
  type Dependencies,
  type ServiceInitializer,
} from 'knifecycle';
import { performance } from 'node:perf_hooks';
import { type JsonValue } from 'type-fest';
import { type WhookOTelTracerService } from '../services/oTelTracer.js';

export interface WhookOTelCronsHandlersDependencies {
  oTelTracer: WhookOTelTracerService;
  log?: LogService;
}

export default function wrapCronsHandlersWithOTel<D extends Dependencies>(
  initCronsHandlers: ServiceInitializer<D, WhookCronsHandlersService>,
): ServiceInitializer<
  D & WhookOTelCronsHandlersDependencies,
  WhookCronsHandlersService
> {
  const augmentedInitializer = alsoInject<
    WhookOTelCronsHandlersDependencies,
    D,
    WhookCronsHandlersService
  >(['oTelTracer', '?log'], initCronsHandlers);

  return wrapInitializer(
    async (
      { oTelTracer, log = noop }: WhookOTelCronsHandlersDependencies,
      CRONS_HANDLERS: WhookCronsHandlersService,
    ) => {
      log('warning', '📈 - Wrapping cron handlers with OpenTelemetry spans.');

      // Remove bad handler due to additional service injection
      delete CRONS_HANDLERS.oTelTracer;

      const wrappedCronsHandlers: WhookCronsHandlersService = {};

      for (const [cronName, cronHandler] of Object.entries(CRONS_HANDLERS)) {
        wrappedCronsHandlers[cronName] = wrapCronHandler(
          {
            cronName,
            oTelTracer,
          },
          cronHandler,
        );
      }

      return wrappedCronsHandlers;
    },
    augmentedInitializer,
  );
}

function wrapCronHandler(
  {
    cronName,
    oTelTracer,
  }: {
    cronName: string;
    oTelTracer: WhookOTelTracerService;
  },
  cronHandler: WhookCronHandler<JsonValue>,
): WhookCronHandler<JsonValue> {
  return async (...args: Parameters<WhookCronHandler<JsonValue>>) => {
    const parentContext = context.active();
    const span = oTelTracer.startSpan(
      'whook.cron.execution',
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'whook.cron.name': cronName,
        },
      },
      parentContext,
    );
    const spanContext = trace.setSpan(parentContext, span);
    const executionStart = performance.now();

    try {
      const result = await context.with(spanContext, () =>
        cronHandler(...args),
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
      span.setAttribute(
        'whook.execution.duration_ms',
        performance.now() - executionStart,
      );
      span.end();
    }
  };
}
