import { describe, it, expect } from '@jest/globals';
import initGetDiagnostic from './getDiagnostic.js';

describe('getDiagnostic', () => {
  const TRANSACTIONS = {} as Components.Responses.Diagnostic<number>['body'];

  it('should work', async () => {
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
