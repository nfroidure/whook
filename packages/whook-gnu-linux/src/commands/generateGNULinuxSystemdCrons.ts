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
import {
  buildSystemdCronServiceContent,
  buildSystemdCronTimerContent,
} from '../libs/templates.js';

export const definition = {
  name: 'generateGNULinuxSystemdCrons',
  description: 'Generate systemd services/timers for Whook crons.',
  example: 'whook generateGNULinuxSystemdCrons',
  arguments: [
    {
      name: 'outputDir',
      description: 'Where generated files should be written.',
      schema: {
        type: 'string',
        default: './builds/gnu-linux/systemd',
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

async function initGenerateGNULinuxSystemdCronsCommand({
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

    await mkdir(targetDir, { recursive: true });

    for (const name of Object.keys(CRONS_DEFINITIONS)) {
      const serviceName = `whook-cron-${name}`;
      const servicePath = join(targetDir, `${serviceName}.service`);
      const timerPath = join(targetDir, `${serviceName}.timer`);

      await Promise.all([
        writeFile(
          servicePath,
          buildSystemdCronServiceContent(name, {
            APP_ENV,
            PROJECT_DIR,
            LOGS_DIR: logsDir,
          }),
        ),
        writeFile(timerPath, buildSystemdCronTimerContent(serviceName)),
      ]);
    }

    log('warning', `🗂️ - Systemd cron units generated in ${targetDir}`);
    log(
      'warning',
      `👉 - Install with: sudo cp ${targetDir}/whook-cron-* /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable --now whook-cron-*.timer`,
    );
  };
}

export default location(
  autoService(initGenerateGNULinuxSystemdCronsCommand),
  import.meta.url,
);
