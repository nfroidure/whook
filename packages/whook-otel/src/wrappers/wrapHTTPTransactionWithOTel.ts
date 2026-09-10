import {
  context,
  SpanKind,
  SpanStatusCode,
  trace,
  type Context,
  type Span,
} from '@opentelemetry/api';
import {
  type WhookHTTPTransaction,
  type WhookHTTPTransactionService,
  type WhookResponse,
} from '@whook/whook';
import { noop, type LogService } from 'common-services';
import {
  alsoInject,
  wrapInitializer,
  type Dependencies,
  type ServiceInitializer,
} from 'knifecycle';
import { performance } from 'node:perf_hooks';
import { type IncomingMessage, type ServerResponse } from 'node:http';
import {
  getRequestContext,
  type WhookOTelRequestContext,
} from '../libs/requestTraceContext.js';
import { markSpanError } from '../libs/spans.js';
import { type WhookOTelTracerService } from '../services/otelTracer.js';

export type WhookOTelHTTPTransactionDependencies = {
  otelTracer: WhookOTelTracerService;
  log?: LogService;
};

type SpanContextPayload = {
  requestContext: WhookOTelRequestContext | undefined;
  transactionSpan: Span;
  transactionContext: Context;
};

export default function wrapHTTPTransactionWithOTel<D extends Dependencies>(
  initHTTPTransaction: ServiceInitializer<D, WhookHTTPTransactionService>,
): ServiceInitializer<
  D & WhookOTelHTTPTransactionDependencies,
  WhookHTTPTransactionService
> {
  const augmentedInitializer = alsoInject<
    WhookOTelHTTPTransactionDependencies,
    D,
    WhookHTTPTransactionService
  >(['otelTracer', '?log'], initHTTPTransaction);

  return wrapInitializer(
    async (
      { otelTracer, log = noop }: WhookOTelHTTPTransactionDependencies,
      httpTransaction: WhookHTTPTransactionService,
    ) => {
      log(
        'warning',
        '📈 - Wrapping HTTP transactions with OpenTelemetry spans.',
      );

      return async (
        req: IncomingMessage,
        res: ServerResponse,
      ): Promise<WhookHTTPTransaction> => {
        const requestContext = getRequestContext();
        const parentContext = requestContext?.routerSpan
          ? trace.setSpan(context.active(), requestContext.routerSpan)
          : context.active();
        const path = (req.url || '/').split('?')[0] || '/';
        const method = (req.method || 'GET').toUpperCase();
        const transactionSpan = otelTracer.startSpan(
          'whook.http.transaction',
          {
            kind: SpanKind.INTERNAL,
            attributes: {
              'http.request.method': method,
              'url.path': path,
            },
          },
          parentContext,
        );
        const transactionContext = trace.setSpan(parentContext, transactionSpan);

        if (requestContext) {
          requestContext.transactionSpan = transactionSpan;
        }

        const { request, transaction } = await context.with(
          transactionContext,
          () => httpTransaction(req, res),
        );

        return {
          request,
          transaction: {
            ...transaction,
            start: startTransaction.bind(
              null,
              {
                requestContext,
                transactionSpan,
                transactionContext,
              },
              transaction.start,
            ),
            catch: catchTransaction.bind(
              null,
              {
                requestContext,
                transactionSpan,
                transactionContext,
              },
              transaction.catch,
            ),
            end: endTransaction.bind(
              null,
              {
                requestContext,
                transactionSpan,
                transactionContext,
              },
              transaction.end,
            ),
          },
        };
      };
    },
    augmentedInitializer,
  );
}

async function startTransaction(
  { requestContext, transactionSpan, transactionContext }: SpanContextPayload,
  transactionStart: WhookHTTPTransaction['transaction']['start'],
  buildResponse: () => Promise<WhookResponse>,
): Promise<WhookResponse> {
  const pipelineStart = performance.now();

  if (requestContext) {
    requestContext.routeExecutionDurationMs = 0;
    requestContext.routerSpan?.addEvent('whook.router.routing.started');
  }

  try {
    const response = await context.with(transactionContext, () =>
      transactionStart(() => context.with(transactionContext, buildResponse)),
    );
    const routingDurationMs = performance.now() - pipelineStart;
    const executionDurationMs = requestContext?.routeExecutionDurationMs || 0;
    const parsingDurationMs = Math.max(0, routingDurationMs - executionDurationMs);

    if (requestContext) {
      requestContext.routerSpan?.addEvent('whook.router.parsing.completed', {
        duration_ms: parsingDurationMs,
      });
      requestContext.routerSpan?.addEvent('whook.router.execution.completed', {
        duration_ms: executionDurationMs,
      });
      requestContext.routerSpan?.addEvent('whook.router.routing.completed', {
        duration_ms: routingDurationMs,
      });
    }

    transactionSpan.setAttribute(
      'whook.router.parsing.duration_ms',
      parsingDurationMs,
    );
    transactionSpan.setAttribute(
      'whook.router.execution.duration_ms',
      executionDurationMs,
    );
    transactionSpan.setAttribute('whook.router.routing.duration_ms', routingDurationMs);

    return response;
  } catch (err) {
    markSpanError(transactionSpan, err);
    throw err;
  }
}

async function catchTransaction(
  {
    requestContext,
    transactionSpan,
    transactionContext,
  }: SpanContextPayload,
  transactionCatch: WhookHTTPTransaction['transaction']['catch'],
  err: Error,
): Promise<never> {
  requestContext?.routerSpan?.addEvent('whook.router.execution.failed');
  markSpanError(transactionSpan, err);

  return context.with(transactionContext, () => transactionCatch(err));
}

async function endTransaction(
  {
    requestContext,
    transactionSpan,
    transactionContext,
  }: SpanContextPayload,
  transactionEnd: WhookHTTPTransaction['transaction']['end'],
  response: WhookResponse,
  operationId = 'none',
): Promise<void> {
  const transferStart = performance.now();

  if (operationId !== 'none') {
    transactionSpan.setAttribute('whook.operation.id', operationId);
    requestContext?.routerSpan?.setAttribute('whook.operation.id', operationId);
  }

  try {
    await context.with(transactionContext, () =>
      transactionEnd(response, operationId),
    );

    transactionSpan.setAttribute('http.response.status_code', response.status);
    transactionSpan.setStatus({
      code:
        response.status >= 500 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
    });
  } catch (err) {
    markSpanError(transactionSpan, err);
    throw err;
  } finally {
    const transferDurationMs = performance.now() - transferStart;

    requestContext?.routerSpan?.addEvent('whook.router.transfer.completed', {
      duration_ms: transferDurationMs,
    });
    transactionSpan.setAttribute(
      'whook.router.transfer.duration_ms',
      transferDurationMs,
    );
    transactionSpan.end();

    if (requestContext?.transactionSpan === transactionSpan) {
      requestContext.transactionSpan = undefined;
    }
  }
}
