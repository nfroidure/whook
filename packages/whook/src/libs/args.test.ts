import { describe, test, expect } from '@jest/globals';
import { readArgs, parseArgs } from './args.js';
import { definition as handlerCommandDefinition } from '../commands/handler.js';
import { YError } from 'yerror';
import type { WhookCommandArgs } from '../libs/args.js';

describe('parseArgs', () => {
  test('should parse args', async () => {
    const args = await parseArgs([
      'whook',
      'handler',
      '--name',
      'getPing',
      '--parameters',
      '{}',
    ]);

    expect(args).toMatchInlineSnapshot(`
{
  "command": "handler",
  "namedArguments": {
    "name": "getPing",
    "parameters": "{}",
  },
  "rest": [],
}
`);
  });
});

describe('readArgs', () => {
  test('should work with no args', () => {
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
      {
        "args": {
          "command": "npx",
          "namedArguments": {},
          "rest": [
            "whook",
          ],
        },
      }
    `);
  });

  test('should work with named args', () => {
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
      {
        "args": {
          "command": "npx",
          "namedArguments": {
            "name": "getPing",
            "parameters": "{}",
          },
          "rest": [
            "whook",
          ],
        },
      }
    `);
  });

  test('should work with listed args', () => {
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
      {
        "args": {
          "command": "npx",
          "namedArguments": {},
          "rest": [
            "whook",
            "hey",
          ],
        },
      }
    `);
  });

  test('should report named args errors', () => {
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
        {
          "args": {
            "command": "npx",
            "namedArguments": {
              "parameters": "{}",
            },
            "rest": [
              "whook",
            ],
          },
          "errorCode": "E_BAD_ARGS",
          "errorParams": [
            [
              {
                "instancePath": "",
                "keyword": "required",
                "message": "must have required property 'name'",
                "params": {
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
