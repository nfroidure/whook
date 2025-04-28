import { type DelayService, type LogService } from 'common-services';
import { type Injector, type Service, autoService, location } from 'knifecycle';
import { CronExpressionParser } from 'cron-parser';
import ms, { type StringValue } from 'ms';
import {
  type WhookCommandDefinition,
  type WhookCommandHandler,
} from '../types/commands.js';
import { type WhookCronsDefinitionsService } from '../services/CRONS_DEFINITIONS.js';

export const definition = {
  name: 'cronSchedule',
  description: 'A command to run a cron schedules for a given time frame',
  example: `whook cronSchedule --name handleTime --startDate '1970-01-01T00:00:00.000Z' --endDate '1970-01-01T00:00:00.000Z'`,
  arguments: [
    {
      name: 'name',
      description: 'The cron handler name',
      required: true,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'startDate',
      description: 'The schedule start date',
      required: true,
      schema: {
        type: 'string',
        format: 'date-time',
        default: new Date().toISOString(),
      },
    },
    {
      name: 'endDate',
      description: 'The schedule end date',
      required: true,
      schema: {
        type: 'string',
        format: 'date-time',
        default: new Date().toISOString(),
      },
    },
    {
      name: 'delay',
      description: 'The delay between each run',
      schema: {
        type: 'string',
        default: '1s',
      },
    },
    {
      name: 'body',
      description: 'Eventually override body',
      schema: {
        type: 'string',
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

async function initCronRunCommand({
  CRONS_DEFINITIONS,
  $injector,
  log,
  delay,
}: {
  CRONS_DEFINITIONS: WhookCronsDefinitionsService;
  $injector: Injector<Service>;
  log: LogService;
  delay: DelayService;
}) {
  const handler: WhookCommandHandler<{
    name: string;
    startDate: string;
    endDate: string;
    delay: StringValue;
    body: string;
  }> = async (args): Promise<void> => {
    const {
      namedArguments: { name, startDate, endDate, delay: cronDelay, body },
    } = args;

    const definition = CRONS_DEFINITIONS[name];
    const handler = (await $injector([name]))[name];

    for (const schedule of definition.module.definition.schedules) {
      const instances = CronExpressionParser.parse(schedule.rule, {
        currentDate: new Date(startDate),
        endDate: new Date(endDate),
        tz: 'utc',
      });
      log(
        'warning',
        `⌚ - Running crons of ${name} for ${JSON.stringify(schedule)}`,
      );

      while (instances.hasNext()) {
        const date = instances.next().toISOString();

        log('warning', `⌚ - Running the cron at ${date}`);

        await handler({
          date,
          body: body ? JSON.parse(body) : schedule.body,
        });
        if (cronDelay) {
          await delay.create(ms(cronDelay));
        }
      }
    }
  };

  return handler;
}

export default location(autoService(initCronRunCommand), import.meta.url);
