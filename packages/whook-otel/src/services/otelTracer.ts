import { autoService, location, name } from 'knifecycle';
import { trace, type Tracer } from '@opentelemetry/api';

export type WhookOTelTracerConfig = {
  OTEL_TRACER_NAME?: string;
  OTEL_TRACER_VERSION?: string;
};

export type WhookOTelTracerService = Tracer;

export const DEFAULT_OTEL_TRACER_NAME = '@whook/otel';

export default location(
  name('otelTracer', autoService(initOTelTracer)),
  import.meta.url,
);

async function initOTelTracer({
  OTEL_TRACER_NAME = DEFAULT_OTEL_TRACER_NAME,
  OTEL_TRACER_VERSION = undefined,
}: WhookOTelTracerConfig): Promise<WhookOTelTracerService> {
  return trace.getTracer(OTEL_TRACER_NAME, OTEL_TRACER_VERSION);
}
