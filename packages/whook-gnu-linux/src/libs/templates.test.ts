import { describe, test, expect } from '@jest/globals';
import {
  buildCrontabContent,
  buildLogrotateConfigContent,
  buildSystemdCronServiceContent,
  getCronSchedules,
  type GNUWhookCronSchedule,
} from './templates.js';
import { type WhookCronsDefinitionsService } from '@whook/whook';

describe('getCronSchedules', () => {
  test('should flatten schedules from all crons', () => {
    expect(
      getCronSchedules({
        handleOne: {
          module: {
            definition: {
              schedules: [
                { rule: '*/5 * * * *' },
                { rule: '0 * * * *' },
              ],
            },
          },
        },
      } as unknown as WhookCronsDefinitionsService),
    ).toEqual([
      { name: 'handleOne', rule: '*/5 * * * *' },
      { name: 'handleOne', rule: '0 * * * *' },
    ]);
  });
});

describe('buildCrontabContent', () => {
  test('should include injected date and cronRun command', () => {
    const cronSchedules: GNUWhookCronSchedule[] = [
      { name: 'handlePing', rule: '*/5 * * * *' },
    ];

    expect(
      buildCrontabContent(cronSchedules, {
        APP_ENV: 'prod',
        PROJECT_DIR: '/srv/whook',
        LOGS_DIR: '/var/log/whook',
      }),
    ).toContain(
      '*/5 * * * * cd "/srv/whook" && APP_ENV="prod" NODE_ENV=production ./node_modules/.bin/whook cronRun --name "handlePing" --date "$(date -u +\\%Y-\\%m-\\%dT\\%H:\\%M:\\%SZ)" >> "/var/log/whook/cron.log" 2>&1',
    );
  });
});

describe('buildSystemdCronServiceContent', () => {
  test('should run cronSchedule in a sliding window', () => {
    expect(
      buildSystemdCronServiceContent('handlePing', {
        APP_ENV: 'prod',
        PROJECT_DIR: '/srv/whook',
        LOGS_DIR: '/var/log/whook',
      }),
    ).toContain(
      'cronSchedule --name "handlePing" --startDate "$(date -u -d "-2 minute" +%Y-%m-%dT%H:%M:%SZ)" --endDate "$(date -u +%Y-%m-%dT%H:%M:%SZ)"',
    );
  });
});

describe('buildLogrotateConfigContent', () => {
  test('should target all log files', () => {
    expect(buildLogrotateConfigContent('/var/log/whook')).toContain(
      '/var/log/whook/*.log',
    );
  });
});
