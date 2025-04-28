import { type LogService } from 'common-services';
import {
  type Injector,
  type Provider,
  autoService,
  location,
} from 'knifecycle';
import { type WhookRouteHandler } from '../types/routes.js';
import { type WhookRoutesDefinitionsService } from './ROUTES_DEFINITIONS.js';
import { YError } from 'yerror';

export type WhookRouteInvokerService<T extends WhookRouteHandler> = (
  functionName: string,
  parameters: Partial<Parameters<T>[0]>,
  wait: boolean,
) => Promise<typeof wait extends true ? ReturnType<T> : void>;

// One can just inject a route handler
// but for mocking the use of cloud
// functions/lambdas this service can
// be useful
async function initRouteInvoker<
  T extends WhookRouteHandler,
  S extends Record<string, T>,
>({
  ROUTES_DEFINITIONS,
  $injector,
  log,
}: {
  ROUTES_DEFINITIONS: WhookRoutesDefinitionsService;
  $injector: Injector<S>;
  log: LogService;
}): Promise<Provider<WhookRouteInvokerService<T>>> {
  log('warning', '🖥 - Running with the route invoker service.');

  let disposing = false;
  const currentInvokations: Promise<void>[] = [];
  const routeInvoker: WhookRouteInvokerService<T> = async (
    functionName,
    parameters,
    wait = false,
  ) => {
    if (disposing) {
      throw new YError('E_DISPOSING');
    }

    const responsePromise = (async () => {
      const routeHandler = (await $injector([functionName]))[functionName];
      const response = await routeHandler(
        {
          query: {},
          header: {},
          path: {},
          cookie: {},
          body: {},
          options: {},
          ...parameters,
        },
        ROUTES_DEFINITIONS[functionName].module.definition,
      );

      return response;
    })();

    if (wait === true) {
      return (await responsePromise) as unknown as void;
    } else {
      const promise = responsePromise.then(() => {
        currentInvokations.splice(currentInvokations.indexOf(promise), 1);
      });

      currentInvokations.push(promise);
    }
  };

  return {
    service: routeInvoker,
    dispose: async () => {
      disposing = true;
      if (currentInvokations.length) {
        log(
          'warning',
          `🖥 - Waiting for pending route invocations to end ( ${currentInvokations.length} left).`,
        );

        await Promise.all(currentInvokations);
      }
    },
  };
}

export default location(autoService(initRouteInvoker), import.meta.url);
