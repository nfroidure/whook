import initGetDiagnostic from './getDiagnostic';

describe('getDiagnostic', () => {
  const TRANSACTIONS = {};

  it('should work', async () => {
    const getDiagnostic = await initGetDiagnostic({
      TRANSACTIONS,
    });
    const response = await getDiagnostic();

    expect({
      response,
    }).toMatchInlineSnapshot(`
      Object {
        "response": Object {
          "body": Object {
            "transactions": Object {},
          },
          "status": 200,
        },
      }
    `);
  });
});
