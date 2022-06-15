import { readArgs } from './args.js';
import { definition as handlerCommandDefinition } from '../commands/handler.js';
import { YError } from 'yerror';
import type { WhookCommandArgs } from '../index.js';

describe('readArgs', () => {
  it('should work with no args', () => {
    const args: WhookCommandArgs = {
      command: 'npx',
      namedArguments: {},
      rest: ['whook'],
    };

    readArgs(
      {
        type: 'object',
        additionalProperties: false,
        properties: {},
      },
      args,
    );

    expect({
      args,
    }).toMatchInlineSnapshot(`
      Object {
        "args": Object {
          "command": "npx",
          "namedArguments": Object {},
          "rest": Array [
            "whook",
          ],
        },
      }
    `);
  });

  it('should work with named args', () => {
    const args: WhookCommandArgs = {
      command: 'npx',
      namedArguments: {
        name: 'getPing',
        parameters: '{}',
      },
      rest: ['whook'],
    };

    readArgs(handlerCommandDefinition.arguments, args);

    expect({
      args,
    }).toMatchInlineSnapshot(`
      Object {
        "args": Object {
          "command": "npx",
          "namedArguments": Object {
            "name": "getPing",
            "parameters": "{}",
          },
          "rest": Array [
            "whook",
          ],
        },
      }
    `);
  });

  it('should work with listed args', () => {
    const args: WhookCommandArgs = {
      command: 'npx',
      namedArguments: {},
      rest: ['whook', 'hey'],
    };

    readArgs(
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          _: {
            type: 'array',
            description: 'Rest params',
            items: {
              type: 'string',
            },
          },
        },
      },
      args,
    );

    expect({
      args,
    }).toMatchInlineSnapshot(`
      Object {
        "args": Object {
          "command": "npx",
          "namedArguments": Object {},
          "rest": Array [
            "whook",
            "hey",
          ],
        },
      }
    `);
  });

  it('should report named args errors', () => {
    const args: WhookCommandArgs = {
      command: 'npx',
      namedArguments: {
        parameters: '{}',
      },
      rest: ['whook'],
    };

    try {
      readArgs(handlerCommandDefinition.arguments, args);
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        args,
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
      }).toMatchInlineSnapshot(`
        Object {
          "args": Object {
            "command": "npx",
            "namedArguments": Object {
              "parameters": "{}",
            },
            "rest": Array [
              "whook",
            ],
          },
          "errorCode": "E_BAD_ARGS",
          "errorParams": Array [
            Array [
              Object {
                "instancePath": "",
                "keyword": "required",
                "message": "must have required property 'name'",
                "params": Object {
                  "missingProperty": "name",
                },
                "schemaPath": "#/required",
              },
            ],
          ],
        }
      `);
    }
  });
});
