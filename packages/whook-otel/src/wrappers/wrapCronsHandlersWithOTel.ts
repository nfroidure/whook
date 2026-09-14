import { context, SpanKind, trace } from '@opentelemetry/api';
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
import { markSpanError } from '../libs/spans.js';
import { type WhookOTelTracerService } from '../services/otelTracer.js';

export type WhookOTelCronsHandlersDependencies = {
  otelTracer: WhookOTelTracerService;
  log?: LogService;
};

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
  >(['otelTracer', '?log'], initCronsHandlers);

  return wrapInitializer(
    async (
      { otelTracer, log = noop }: WhookOTelCronsHandlersDependencies,
      CRONS_HANDLERS: WhookCronsHandlersService,
    ) => {
      log('warning', '📈 - Wrapping cron handlers with OpenTelemetry spans.');

      const wrappedCronsHandlers: WhookCronsHandlersService = {};

      for (const [cronName, cronHandler] of Object.entries(CRONS_HANDLERS)) {
        wrappedCronsHandlers[cronName] = wrapCronHandler(
          {
            cronName,
            otelTracer,
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
    otelTracer,
  }: {
    cronName: string;
    otelTracer: WhookOTelTracerService;
  },
  cronHandler: WhookCronHandler<JsonValue>,
): WhookCronHandler<JsonValue> {
  return async (...args: Parameters<WhookCronHandler<JsonValue>>) => {
    const parentContext = context.active();
    const span = otelTracer.startSpan(
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
      return await context.with(spanContext, () => cronHandler(...args));
    } catch (err) {
      markSpanError(span, err);
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
