import { YError } from 'yerror';
import path from 'node:path';
import { type LogService } from 'common-services';
import {
  type WhookAPIHandlerDefinition,
  type WhookOpenAPI,
} from '@whook/whook';
import { pathItemToOperationMap } from 'ya-open-api-types';

export async function loadFunction(
  {
    PROJECT_DIR,
    APP_ENV,
    log,
  }: {
    PROJECT_DIR: string;
    APP_ENV: string;
    log: LogService;
  },
  operationId: string,
  type: string,
  extension = '.mjs',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const modulePath = path.join(
    PROJECT_DIR,
    'builds',
    APP_ENV,
    operationId,
    type + extension,
  );

  log('debug', `⛏️ - Loading function module at path "${modulePath}".`);

  try {
    const module = await import(modulePath);

    if (!module) {
      throw new YError('E_MODULE_NOT_FOUND', module);
    }

    if (!module.default) {
      throw new YError('E_LAMBDA_NOT_FOUND', module, Object.keys(module));
    }

    return module.default;
  } catch (err) {
    throw YError.wrap(err as Error, 'E_LAMBDA_LOAD');
  }
}

export function getOpenAPIDefinitions(
  API: WhookOpenAPI,
): WhookAPIHandlerDefinition[] {
  const definitions: WhookAPIHandlerDefinition[] = [];

  for (const [path, pathItem] of Object.entries(API.paths || {})) {
    for (const [method, operation] of Object.entries(
      pathItemToOperationMap(pathItem || {}),
    )) {
      definitions.push({
        path,
        method,
        operation,
        config: { type: 'http', ...((operation['x-whook'] as object) || {}) },
      } as unknown as WhookAPIHandlerDefinition);
    }
  }

  return definitions;
}
