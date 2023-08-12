import { YError } from 'yerror';
import path from 'path';
import type { LogService } from 'common-services';

export async function loadFunction(
  {
    PROJECT_DIR,
    log,
  }: {
    PROJECT_DIR: string;
    log: LogService;
  },
  target: string,
  operationId: string,
  type: string,
  extension = '.mjs',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const modulePath = path.join(
    PROJECT_DIR,
    'builds',
    target,
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
