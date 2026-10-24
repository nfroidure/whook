import { type LogService } from 'common-services';
import {
  type Injector,
  type Provider,
  autoService,
  location,
} from 'knifecycle';
import { type WhookRouteHandler } from '../types/routes.js';
import { type WhookRoutesDeclarationsService } from './ROUTES_DECLARATIONS.js';
import { YError } from 'yerror';

export type WhookRouteInvokerService<T extends WhookRouteHandler> = (
  functionName: string,
  parameters: Partial<Parameters<T>[0]>,
  wait: boolean,
) => Promise<typeof wait extends true ? ReturnType<T> : undefined>;

// One can just inject a route handler
// but for mocking the use of cloud
// functions/lambdas this service can
// be useful
async function initRouteInvoker<
  T extends WhookRouteHandler,
  S extends Record<string, T>,
>({
  ROUTES_DECLARATIONS,
  $injector,
  log,
}: {
  ROUTES_DECLARATIONS: WhookRoutesDeclarationsService;
  $injector: Injector<S>;
  log: LogService;
}): Promise<Provider<WhookRouteInvokerService<T>>> {
  log('warning', '🖥 - Running with the route invoker service.');

  let disposing = false;
  const currentInvocations: Promise<void>[] = [];
  const routeInvoker = (async (functionName, parameters, wait = false) => {
    if (disposing) {
      throw new YError('E_DISPOSING');
    }

    const responsePromise = (async () => {
      const routeHandler = (await $injector([functionName]))[functionName];
      const response = await routeHandler(
        {
          query: {},
          headers: {},
          path: {},
          cookies: {},
          body: {},
          options: {},
          ...parameters,
        },
        ROUTES_DECLARATIONS.routes[functionName].content,
      );

      return response;
    })();

    if (wait === true) {
      return await responsePromise;
    } else {
      const promise = responsePromise.then(() => {
        currentInvocations.splice(currentInvocations.indexOf(promise), 1);
      });

      currentInvocations.push(promise);
    }
    return undefined;
  }) as WhookRouteInvokerService<T>;

  return {
    service: routeInvoker,
    dispose: async () => {
      disposing = true;
      if (currentInvocations.length) {
        log(
          'warning',
          `🖥 - Waiting for pending route invocations to end ( ${currentInvocations.length} left).`,
        );

        await Promise.all(currentInvocations);
      }
    },
  };
}

export default location(autoService(initRouteInvoker), import.meta.url);
