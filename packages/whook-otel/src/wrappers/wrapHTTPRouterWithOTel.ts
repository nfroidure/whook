import {
  context,
  SpanKind,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api';
import {
  type WhookHTTPRouterProvider,
  type WhookHTTPRouterService,
} from '@whook/whook';
import { noop, type LogService } from 'common-services';
import {
  alsoInject,
  wrapInitializer,
  type Dependencies,
  type ProviderInitializer,
} from 'knifecycle';
import { type IncomingMessage, type ServerResponse } from 'node:http';
import { markSpanError } from '../libs/spans.js';
import { runWithRequestContext } from '../libs/requestTraceContext.js';
import { type WhookOTelTracerService } from '../services/otelTracer.js';

export type WhookOTelHTTPRouterDependencies = {
  otelTracer: WhookOTelTracerService;
  log?: LogService;
};

export default function wrapHTTPRouterWithOTel<D extends Dependencies>(
  initHTTPRouter: ProviderInitializer<D, WhookHTTPRouterService>,
): ProviderInitializer<D & WhookOTelHTTPRouterDependencies, WhookHTTPRouterService> {
  const augmentedInitializer = alsoInject<
    WhookOTelHTTPRouterDependencies,
    D,
    WhookHTTPRouterService
  >(['otelTracer', '?log'], initHTTPRouter);

  return wrapInitializer(
    async (
      { otelTracer, log = noop }: WhookOTelHTTPRouterDependencies,
      httpRouter: WhookHTTPRouterProvider,
    ) => {
      log('warning', '📈 - Wrapping HTTP router with OpenTelemetry spans.');

      async function otelHTTPRouter(
        req: IncomingMessage,
        res: ServerResponse,
      ): Promise<void> {
        const path = (req.url || '/').split('?')[0] || '/';
        const method = (req.method || 'GET').toUpperCase();
        const routerSpan = otelTracer.startSpan('whook.http.router', {
          kind: SpanKind.SERVER,
          attributes: {
            'http.request.method': method,
            'url.path': path,
          },
        });
        const routerSpanContext = trace.setSpan(context.active(), routerSpan);

        try {
          await runWithRequestContext(
            {
              routerSpan,
              routeExecutionDurationMs: 0,
            },
            () =>
              context.with(routerSpanContext, () => httpRouter.service(req, res)),
          );
        } catch (err) {
          markSpanError(routerSpan, err);
          throw err;
        } finally {
          routerSpan.setAttribute('http.response.status_code', res.statusCode);
          routerSpan.setStatus({
            code:
              res.statusCode >= 500
                ? SpanStatusCode.ERROR
                : SpanStatusCode.OK,
          });
          routerSpan.end();
        }
      }

      return {
        ...httpRouter,
        service: otelHTTPRouter,
      };
    },
    augmentedInitializer,
  );
}
