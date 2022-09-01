import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import { YError } from 'yerror';
import initImporter from './importer.js';
import type { LogService } from 'common-services';

describe('Importer', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should work with existing module', async () => {
    const importer = await initImporter({
      log,
    });

    const result = await importer('@whook/http-server');

    expect({
      result: typeof result,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
      {
        "logCalls": [
          [
            "debug",
            "🛂 - Initializing the importer!",
          ],
          [
            "debug",
            "🛂 - Dynamic import of "@whook/http-server".",
          ],
        ],
        "result": "object",
      }
    `);
  });

  test('should fail with unexisting module', async () => {
    const importer = await initImporter({
      log,
    });

    try {
      await importer('@nowhere/anywhere');
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
        logCalls: log.mock.calls.filter(([type]) => !type.startsWith('debug-')),
      }).toMatchInlineSnapshot(`
        {
          "errorCode": "E_RUNTIME_IMPORT_FAILURE",
          "errorParams": [
            "@nowhere/anywhere",
            "Cannot find module '@nowhere/anywhere' from 'src/services/importer.ts'",
          ],
          "logCalls": [
            [
              "debug",
              "🛂 - Initializing the importer!",
            ],
            [
              "debug",
              "🛂 - Dynamic import of "@nowhere/anywhere".",
            ],
            [
              "debug",
              "⚠️ - Got a runtime import error for "@nowhere/anywhere" !",
            ],
          ],
        }
      `);
    }
  });
});
