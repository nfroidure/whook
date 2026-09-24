import { context, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
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
import { runWithRequestContext } from '../libs/requestTraceContext.js';
import { type WhookOTelTracerService } from '../services/oTelTracer.js';

export interface WhookOTelHTTPRouterDependencies {
  oTelTracer: WhookOTelTracerService;
  log?: LogService;
}

export default function wrapHTTPRouterWithOTel<D extends Dependencies>(
  initHTTPRouter: ProviderInitializer<D, WhookHTTPRouterService>,
): ProviderInitializer<
  D & WhookOTelHTTPRouterDependencies,
  WhookHTTPRouterService
> {
  const augmentedInitializer = alsoInject<
    WhookOTelHTTPRouterDependencies,
    D,
    WhookHTTPRouterService
  >(['oTelTracer', '?log'], initHTTPRouter);

  return wrapInitializer(
    async (
      { oTelTracer, log = noop }: WhookOTelHTTPRouterDependencies,
      httpRouter: WhookHTTPRouterProvider,
    ) => {
      log('warning', '📈 - Wrapping HTTP router with OpenTelemetry spans.');

      async function oTelHTTPRouter(
        req: IncomingMessage,
        res: ServerResponse,
      ): Promise<void> {
        const path = (req.url || '/').split('?')[0] || '/';
        const method = (req.method || 'GET').toUpperCase();
        const routerSpan = oTelTracer.startSpan('whook.http.router', {
          kind: SpanKind.INTERNAL,
          attributes: {
            'http.request.method': method,
            'url.path': path,
          },
        });
        const routerSpanContext = trace.setSpan(context.active(), routerSpan);
        let errorMessage: string | undefined;

        try {
          await runWithRequestContext(
            {
              routerSpan,
              routeExecutionDurationMs: 0,
            },
            () =>
              context.with(routerSpanContext, () =>
                httpRouter.service(req, res),
              ),
          );
        } catch (err) {
          routerSpan.recordException(err as Error);
          errorMessage = (err as Error)?.message;
          throw err;
        } finally {
          routerSpan.setAttribute('http.response.status_code', res.statusCode);
          routerSpan.setStatus({
            code:
              res.statusCode >= 500 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
            message: errorMessage,
          });
          routerSpan.end();
        }
      }

      return {
        ...httpRouter,
        service: oTelHTTPRouter,
      };
    },
    augmentedInitializer,
  );
}
