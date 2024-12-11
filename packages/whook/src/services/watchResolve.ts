import {
  initResolve,
  type LogService,
  type ResolveService,
} from 'common-services';
import { name, autoService, singleton, location } from 'knifecycle';
import { type WhookURL } from './WHOOK_RESOLVED_PLUGINS.js';

export default location(
  singleton(name('resolve', autoService(initWatchResolve))),
  import.meta.url,
);

export type WatchResolveDependencies = {
  MAIN_FILE_URL: WhookURL;
  RESTARTS_COUNTER: number;
  log: LogService;
};

async function initWatchResolve({
  MAIN_FILE_URL,
  RESTARTS_COUNTER,
  log,
}: WatchResolveDependencies): Promise<ResolveService> {
  const baseResolve = await initResolve({ MAIN_FILE_URL, log });

  return function resolve(...args: Parameters<typeof baseResolve>): string {
    return (
      baseResolve(...args) +
      (RESTARTS_COUNTER ? '?restartsCounter=' + RESTARTS_COUNTER : '')
    );
  };
}
