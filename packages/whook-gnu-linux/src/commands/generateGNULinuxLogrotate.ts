import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type LogService } from 'common-services';
import { autoService, location } from 'knifecycle';
import {
  type WhookCommandDefinition,
  type WhookCommandHandler,
} from '@whook/whook';
import {
  buildLogrotateConfigContent,
  buildLogrotateCronContent,
  buildLogrotateSystemdServiceContent,
  buildLogrotateSystemdTimerContent,
} from '../libs/templates.js';

export const definition = {
  name: 'generateGNULinuxLogrotate',
  description: 'Generate logrotate files for Whook logs.',
  example: 'whook generateGNULinuxLogrotate',
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
      description: 'The logs directory to rotate.',
      schema: {
        type: 'string',
        default: './var/log/whook',
      },
    },
    {
      name: 'serviceName',
      description: 'Name of the generated logrotate systemd service.',
      schema: {
        type: 'string',
        default: 'whook-logrotate',
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

async function initGenerateGNULinuxLogrotateCommand({
  PROJECT_DIR,
  log,
}: {
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
    const systemdDir = join(targetDir, 'systemd');
    const cronDir = join(targetDir, 'cron');
    const logrotateDir = join(targetDir, 'logrotate');
    const logrotateConfigPath = join(logrotateDir, 'whook.conf');

    await Promise.all([
      mkdir(systemdDir, { recursive: true }),
      mkdir(cronDir, { recursive: true }),
      mkdir(logrotateDir, { recursive: true }),
    ]);
    await Promise.all([
      writeFile(logrotateConfigPath, buildLogrotateConfigContent(logsDir)),
      writeFile(
        join(cronDir, 'whook-logrotate.crontab'),
        buildLogrotateCronContent(logrotateConfigPath),
      ),
      writeFile(
        join(systemdDir, `${serviceName}.service`),
        buildLogrotateSystemdServiceContent(logrotateConfigPath),
      ),
      writeFile(
        join(systemdDir, `${serviceName}.timer`),
        buildLogrotateSystemdTimerContent(serviceName),
      ),
    ]);

    log('warning', `🗂️ - Logrotate files generated under ${targetDir}`);
    log(
      'warning',
      `👉 - Cron install: crontab < ${join(cronDir, 'whook-logrotate.crontab')}`,
    );
    log(
      'warning',
      `👉 - Systemd install: sudo cp ${join(systemdDir, `${serviceName}.`)}{service,timer} /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable --now ${serviceName}.timer`,
    );
  };
}

export default location(
  autoService(initGenerateGNULinuxLogrotateCommand),
  import.meta.url,
);
