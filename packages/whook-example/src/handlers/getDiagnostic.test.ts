import { describe, test, expect } from '@jest/globals';
import initGetDiagnostic from './getDiagnostic.js';

describe('getDiagnostic', () => {
  const TRANSACTIONS =
    {} as components['responses']['Diagnostic']['body']['transactions'];

  test('should work', async () => {
    const getDiagnostic = await initGetDiagnostic({
      TRANSACTIONS,
    });
    const response = await getDiagnostic({});

    expect({
      response,
    }).toMatchInlineSnapshot(`
      {
        "response": {
          "body": {
            "transactions": {},
          },
          "status": 200,
        },
      }
    `);
  });
});
