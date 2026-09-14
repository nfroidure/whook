import { SpanStatusCode, type Span } from '@opentelemetry/api';

export function markSpanError(span: Span, err: unknown): void {
  span.recordException(err as Error);
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: err instanceof Error ? err.message : 'Unexpected error',
  });
}
