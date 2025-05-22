import cron, { type ScheduledTask, type TaskOptions } from 'node-cron';
import { type LogService } from 'common-services';
import { autoProvider, location } from 'knifecycle';
import { type WhookCronsDefinitionsService } from './CRONS_DEFINITIONS.js';
import { type WhookCronsHandlersService } from './CRONS_HANDLERS.js';
import { printStackTrace } from 'yerror';
import { type WhookMain } from '../types/base.js';

/* Architecture Note #2.14: Local cron runner

Whook allows you to run crons locally with the help
 of this local cron runner. Best practice is to
 export them and run it with some external runner
 like cloud ones, systemd or crontab but for small
 standalone projects or local development purposes
 it may be sufficient.
*/

export type WhookCronRunnerService = void;
export type WhookCronRunnerOptions = Required<Pick<TaskOptions, 'timezone'>>;
export type WhookCronRunnerConfig = {
  CRON_RUNNER_OPTIONS?: WhookCronRunnerOptions;
};
export type WhookCronRunnerDependencies = WhookCronRunnerConfig & {
  APP_ENV: WhookMain['AppEnv'];
  CRONS_HANDLERS: WhookCronsHandlersService;
  CRONS_DEFINITIONS: WhookCronsDefinitionsService;
  log: LogService;
};

export const DEFAULT_CRON_RUNNER_OPTIONS: WhookCronRunnerOptions = {
  timezone: 'UTC',
};

async function initLocalCronRunner({
  APP_ENV,
  CRON_RUNNER_OPTIONS = DEFAULT_CRON_RUNNER_OPTIONS,
  CRONS_HANDLERS,
  CRONS_DEFINITIONS,
  log,
}: WhookCronRunnerDependencies) {
  const cronsNames = Object.keys(CRONS_DEFINITIONS);
  const tasks: Record<
    string,
    {
      task: ScheduledTask;
      promises: Promise<void>[];
    }
  > = {};

  log(
    'warning',
    `⌚ - Initializing the local cron runner (${cronsNames.length} crons).`,
  );

  for (const cronName of cronsNames) {
    let index = 0;

    for (const schedule of CRONS_DEFINITIONS[cronName].module.definition
      .schedules) {
      const taskName = `${cronName}-${index++}`;
      const promises: Promise<void>[] = [];

      if (
        schedule.environments !== 'all' ||
        !schedule.environments.includes(APP_ENV)
      ) {
        log(
          'debug',
          `⏳ - Skipped  "${cronName}" crons schedule "${schedule.rule}" since not enabled in environment "${APP_ENV}".`,
        );
        continue;
      }

      log(
        'debug',
        `⌚ - Scheduling the "${cronName}" cron with "${schedule.rule}" (task name: "${taskName}").`,
      );

      const task = cron.schedule(
        schedule.rule,
        () => {
          const promise = (async () => {
            log(
              'debug',
              `⌚ - Running the "${cronName}" cron with "${schedule.rule}" (task name: "${taskName}").`,
            );

            try {
              // Run handler here and await
              await CRONS_HANDLERS[cronName](
                {
                  date: new Date().toISOString(),
                  body: schedule.body,
                },
                CRONS_DEFINITIONS[cronName].module.definition,
              );

              log(
                'debug',
                `✅ - Successfully ran the "${cronName}" cron with "${schedule.rule}" (task name: "${taskName}").`,
              );
            } catch (err) {
              log('error', `❌ - The "${cronName}" cron produced an error.`);
              log('error-stack', printStackTrace(err as Error));
            }

            await Promise.resolve().then(() => {
              promises.splice(promises.indexOf(promise), 1);
            });
          })();

          promises.push(promise);
        },
        {
          name: taskName,
          ...CRON_RUNNER_OPTIONS,
        },
      );

      tasks[taskName] = {
        task,
        promises,
      };

      task.start();
    }
  }

  return {
    service: undefined,
    dispose: async () => {
      let runningCrons = 0;
      for (const taskName of Object.keys(tasks)) {
        tasks[taskName].task.stop();
        runningCrons += tasks[taskName].promises.length;
      }

      log(
        'warning',
        `⌚ - Stopping the local cron runner (${runningCrons} crons running).`,
      );
      for (const taskName of Object.keys(tasks)) {
        await Promise.all(tasks[taskName].promises);
      }
    },
  };
}

export default location(autoProvider(initLocalCronRunner), import.meta.url);
