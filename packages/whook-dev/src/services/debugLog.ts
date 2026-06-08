import {
  type LogService,
  type LogServiceDependencies,
  initLog,
} from 'common-services';
import { alsoInject, name, wrapInitializer } from 'knifecycle';
import { writeFileSync } from 'node:fs';

const initDebugLog = name(
  'debugLog',
  wrapInitializer(
    async ({ ENV }, log) => {
      const logFile = ENV.LOG_FILE || './debug.log';
      log(
        'warning',
        `⚒️ - Enabling log debugging, sending logs to "${logFile}"!`,
      );

      return function debugLog(...args) {
        writeFileSync(logFile, JSON.stringify(args) + '\n', {
          flag: 'a',
        });
        log(...args);
      };
    },

    alsoInject<
      { ENV: Record<string, string> } & LogServiceDependencies,
      LogServiceDependencies,
      LogService
    >(['ENV'], initLog),
  ),
);

export default initDebugLog;
