import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type LogService } from 'common-services';
import { autoService, location } from 'knifecycle';
import {
  type WhookCommandDefinition,
  type WhookCommandHandler,
  type WhookCronsDefinitionsService,
  type WhookMain,
} from '@whook/whook';
import { buildCrontabContent, getCronSchedules } from '../libs/templates.js';

export const definition = {
  name: 'generateGNULinuxCrontab',
  description: 'Generate a crontab file from Whook cron definitions.',
  example: 'whook generateGNULinuxCrontab',
  arguments: [
    {
      name: 'outputDir',
      description: 'Where generated files should be written.',
      schema: {
        type: 'string',
        default: './builds/gnu-linux',
      },
    },
    {
      name: 'logsDir',
      description: 'Where cron logs should be written.',
      schema: {
        type: 'string',
        default: './var/log/whook',
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

async function initGenerateGNULinuxCrontabCommand({
  APP_ENV,
  PROJECT_DIR,
  CRONS_DEFINITIONS,
  log,
}: {
  APP_ENV: WhookMain['AppEnv'];
  PROJECT_DIR: string;
  CRONS_DEFINITIONS: WhookCronsDefinitionsService;
  log: LogService;
}): Promise<
  WhookCommandHandler<{
    outputDir: string;
    logsDir: string;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { outputDir, logsDir },
    } = args;
    const targetDir = join(PROJECT_DIR, outputDir);
    const targetPath = join(targetDir, 'whook.crontab');
    const cronSchedules = getCronSchedules(CRONS_DEFINITIONS);
    const content = buildCrontabContent(cronSchedules, {
      APP_ENV,
      PROJECT_DIR,
      LOGS_DIR: logsDir,
    });

    await mkdir(targetDir, { recursive: true });
    await writeFile(targetPath, content);

    log('warning', `🗂️ - Crontab generated at ${targetPath}`);
    log('warning', `👉 - Install with: crontab < ${targetPath}`);
  };
}

export default location(
  autoService(initGenerateGNULinuxCrontabCommand),
  import.meta.url,
);
