import {
  type WhookCommandDefinition,
  type WhookCommandHandler,
} from '../types/commands.js';
import { type WhookCronsDefinitionsService } from '../services/CRONS_DEFINITIONS.js';

import { type LogService } from 'common-services';
import { type Injector, type Service, autoService, location } from 'knifecycle';

export const definition = {
  name: `cronRun`,
  description: 'A command to run all instances of a cron',
  example: `whook cronRun --name handleTime`,
  arguments: [
    {
      name: 'name',
      description: 'The cron handler name',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'date',
      description: 'The run date',
      schema: {
        type: 'string',
        format: 'date-time',
        default: new Date().toISOString(),
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
}: {
  CRONS_DEFINITIONS: WhookCronsDefinitionsService;
  $injector: Injector<Service>;
  log: LogService;
}): Promise<
  WhookCommandHandler<{
    name: string;
    date: string;
    body: string;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { name, date, body },
    } = args;

    const definition = CRONS_DEFINITIONS[name];
    const handler = (await $injector([name]))[name];

    for (const schedule of definition.module.definition.schedules) {
      log(
        'info',
        `⌚ - Running crons of ${name} at ${date} for ${JSON.stringify(schedule)}`,
      );
      await handler({ date, body: body ? JSON.parse(body) : schedule.body });
    }
  };
}

export default location(autoService(initCronRunCommand), import.meta.url);
