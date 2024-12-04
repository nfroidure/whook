import { type LogService } from 'common-services';
import {
  autoService,
  location,
  type FatalErrorService,
  type Knifecycle,
} from 'knifecycle';
import { printStackTrace, YError } from 'yerror';

export default location(autoService(initCommand), import.meta.url);

async function initCommand({
  commandHandler,
  $ready,
  $instance,
  $fatalError,
  log,
}: {
  commandHandler: () => Promise<void>;
  $ready: Promise<void>;
  $instance: Knifecycle;
  $fatalError: FatalErrorService;
  log: LogService;
}): Promise<void> {
  async function commandRunner() {
    await $ready;
    try {
      await commandHandler();
      await $instance.destroy();
    } catch (err) {
      if ((err as YError).code === 'E_BAD_ARGS') {
        log('error-stack', printStackTrace(err as Error));
        if ((err as YError).params[0][0].keyword === 'required') {
          if ((err as YError).params[0][0].params.missingProperty) {
            log(
              'error',
              `Argument "${
                (err as YError).params[0][0].params.missingProperty
              }" is required.`,
            );
            $fatalError.throwFatalError(err as Error);
            return;
          }
        }
        if ((err as YError).params[0][0].keyword === 'additionalProperties') {
          if ((err as YError).params[0][0].params.additionalProperty === '_') {
            log('error', 'No anonymous arguments allowed.');
            $fatalError.throwFatalError(err as Error);
            return;
          }
          if ((err as YError).params[0][0].params.additionalProperty) {
            log(
              'error',
              `Argument "${
                (err as YError).params[0][0].params.additionalProperty
              }" not allowed.`,
            );
            $fatalError.throwFatalError(err as Error);
            return;
          }
        }
        log(
          'error',
          'Error parsing arguments: ',
          (err as YError).params[0][0].message,
          (err as YError).params[0][0].params,
        );
        $fatalError.throwFatalError(err as Error);
        return;
      }
      $fatalError.throwFatalError(err as Error);
      return;
    }
  }
  commandRunner();
}
