import { context, SpanKind, trace } from '@opentelemetry/api';
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
import { markSpanError } from '../libs/spans.js';
import { type WhookOTelTracerService } from '../services/otelTracer.js';

export type WhookOTelConsumersHandlersDependencies = {
  otelTracer: WhookOTelTracerService;
  log?: LogService;
};

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
  >(['otelTracer', '?log'], initConsumersHandlers);

  return wrapInitializer(
    async (
      { otelTracer, log = noop }: WhookOTelConsumersHandlersDependencies,
      CONSUMERS_HANDLERS: WhookConsumersHandlersService,
    ) => {
      log(
        'warning',
        '📈 - Wrapping consumer handlers with OpenTelemetry spans.',
      );

      const wrappedConsumersHandlers: WhookConsumersHandlersService = {};

      for (const [consumerName, consumerHandler] of Object.entries(
        CONSUMERS_HANDLERS,
      )) {
        wrappedConsumersHandlers[consumerName] = wrapConsumerHandler(
          {
            consumerName,
            otelTracer,
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
    otelTracer,
  }: {
    consumerName: string;
    otelTracer: WhookOTelTracerService;
  },
  consumerHandler: WhookConsumerHandler<JsonValue>,
): WhookConsumerHandler<JsonValue> {
  return async (...args: Parameters<WhookConsumerHandler<JsonValue>>) => {
    const parentContext = context.active();
    const span = otelTracer.startSpan(
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
      return await context.with(spanContext, () => consumerHandler(...args));
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
