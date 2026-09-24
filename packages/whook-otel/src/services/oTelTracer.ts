import { autoService, location, name } from 'knifecycle';
import { trace, type Tracer } from '@opentelemetry/api';

export interface WhookOTelTracerOptions {
  tracerName: string;
  tracerVersion?: string;
}

export interface WhookOTelTracerConfig {
  OTEL_TRACER?: WhookOTelTracerOptions;
}

export type WhookOTelTracerService = Tracer;

export const DEFAULT_OTEL_TRACER = {
  tracerName: '@whook/otel',
} as const satisfies WhookOTelTracerOptions;

async function initOTelTracer({
  OTEL_TRACER = DEFAULT_OTEL_TRACER,
}: WhookOTelTracerConfig): Promise<WhookOTelTracerService> {
  return trace.getTracer(OTEL_TRACER.tracerName, OTEL_TRACER.tracerVersion);
}

export default location(
  name('oTelTracer', autoService(initOTelTracer)),
  import.meta.url,
);
