import { context, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import {
  type WhookConsumerHandler,
  type WhookConsumersHandlersService,
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

export interface WhookOTelConsumersHandlersDependencies {
  oTelTracer: WhookOTelTracerService;
  log?: LogService;
}

export default function wrapConsumersHandlersWithOTel<D extends Dependencies>(
  initConsumersHandlers: ServiceInitializer<D, WhookConsumersHandlersService>,
): ServiceInitializer<
  D & WhookOTelConsumersHandlersDependencies,
  WhookConsumersHandlersService
> {
  const augmentedInitializer = alsoInject<
    WhookOTelConsumersHandlersDependencies,
    D,
    WhookConsumersHandlersService
  >(['oTelTracer', '?log'], initConsumersHandlers);

  return wrapInitializer(
    async (
      { oTelTracer, log = noop }: WhookOTelConsumersHandlersDependencies,
      CONSUMERS_HANDLERS: WhookConsumersHandlersService,
    ) => {
      log(
        'warning',
        '📈 - Wrapping consumer handlers with OpenTelemetry spans.',
      );

      // Remove bad handler due to additional service injection
      delete CONSUMERS_HANDLERS.oTelTracer;

      const wrappedConsumersHandlers: WhookConsumersHandlersService = {};

      for (const [consumerName, consumerHandler] of Object.entries(
        CONSUMERS_HANDLERS,
      )) {
        wrappedConsumersHandlers[consumerName] = wrapConsumerHandler(
          {
            consumerName,
            oTelTracer,
          },
          consumerHandler,
        );
      }

      return wrappedConsumersHandlers;
    },
    augmentedInitializer,
  );
}

function wrapConsumerHandler(
  {
    consumerName,
    oTelTracer,
  }: {
    consumerName: string;
    oTelTracer: WhookOTelTracerService;
  },
  consumerHandler: WhookConsumerHandler<JsonValue>,
): WhookConsumerHandler<JsonValue> {
  return async (...args: Parameters<WhookConsumerHandler<JsonValue>>) => {
    const parentContext = context.active();
    const span = oTelTracer.startSpan(
      'whook.consumer.execution',
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'whook.consumer.name': consumerName,
        },
      },
      parentContext,
    );
    const spanContext = trace.setSpan(parentContext, span);
    const executionStart = performance.now();

    try {
      const result = await context.with(spanContext, () =>
        consumerHandler(...args),
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
