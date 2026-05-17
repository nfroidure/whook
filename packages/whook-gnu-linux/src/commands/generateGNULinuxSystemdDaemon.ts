import { mkdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { type LogService } from 'common-services';
import { autoService, location } from 'knifecycle';
import {
  type WhookCommandDefinition,
  type WhookCommandHandler,
  type WhookMain,
} from '@whook/whook';
import { buildSystemdDaemonServiceContent } from '../libs/templates.js';

export const definition = {
  name: 'generateGNULinuxSystemdDaemon',
  description: 'Generate a systemd service for the Whook daemon.',
  example: 'whook generateGNULinuxSystemdDaemon',
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
      description: 'Where daemon logs should be written.',
      schema: {
        type: 'string',
        default: './var/log/whook',
      },
    },
    {
      name: 'serviceName',
      description: 'Name of the generated systemd service.',
      schema: {
        type: 'string',
        default: 'whook',
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

async function initGenerateGNULinuxSystemdDaemonCommand({
  APP_ENV,
  PROJECT_DIR,
  log,
}: {
  APP_ENV: WhookMain['AppEnv'];
  PROJECT_DIR: string;
  log: LogService;
}): Promise<
  WhookCommandHandler<{
    outputDir: string;
    logsDir: string;
    serviceName: string;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { outputDir, logsDir, serviceName },
    } = args;
    const targetDir = join(PROJECT_DIR, outputDir);
    const targetPath = join(targetDir, `${serviceName}.service`);

    await mkdir(targetDir, { recursive: true });
    await writeFile(
      targetPath,
      buildSystemdDaemonServiceContent({
        APP_ENV,
        PROJECT_DIR,
        LOGS_DIR: logsDir,
        appName: basename(PROJECT_DIR),
      }),
    );

    log('warning', `🗂️ - Daemon systemd unit generated at ${targetPath}`);
    log(
      'warning',
      `👉 - Install with: sudo cp ${targetPath} /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable --now ${serviceName}.service`,
    );
  };
}

export default location(
  autoService(initGenerateGNULinuxSystemdDaemonCommand),
  import.meta.url,
);
