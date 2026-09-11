import { AsyncLocalStorage } from 'node:async_hooks';
import { type Span } from '@opentelemetry/api';

export interface WhookOTelRequestContext {
  routerSpan?: Span;
  transactionSpan?: Span;
  routeExecutionDurationMs: number;
}

const requestContextStorage = new AsyncLocalStorage<WhookOTelRequestContext>();

export function runWithRequestContext<T>(
  requestContext: WhookOTelRequestContext,
  callback: () => T,
): T {
  return requestContextStorage.run(requestContext, callback);
}

export function getRequestContext(): WhookOTelRequestContext | undefined {
  return requestContextStorage.getStore();
}
