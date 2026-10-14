import { describe, test, expect, jest } from '@jest/globals';
import { exec } from 'node:child_process';
import { YError } from 'yerror';
import { join as joinPaths } from 'node:path';
import { identity } from '@whook/whook';

jest.setTimeout(30000);

describe('commands should work', () => {
  test('with ls', async () => {
    const { stdout, stderr } = await execCommand(
      'NO_PROMPT=1 npm run whook --silent -- ls',
    );

    expect({
      stdout: replacePaths(stdout).split(/\r?\n/g).filter(identity).sort(),
      stderr: replacePaths(stderr),
    }).toMatchInlineSnapshot(`
     {
       "stderr": "⚡ - Loading configurations from "file:///project/dist/config/local/config.js".
     🤖 - Initializing the \`$autoload\` service.
     🔴 - Running with "local" application environment.
     🔂 - Running with "test" node environment.
     ➕ - Wrapping definitions for CORS.
     🖃 - Initializing the validators service.
     🏭 - Initializing the COMMANDS_WRAPPERS service.
     💾 - Loading the TypeScript project.
     ✅ - Loaded the TypeScript project.
     🏭 - Initializing the COMMANDS_HANDLERS service with 13 handlers and wrapCommandHandlerForDebug wrappers.
     On air 🚀🌕
     ",
       "stdout": [
         "# Provided by "@whook/authorization": none",
         "# Provided by "@whook/cors": none",
         "# Provided by "@whook/dev": 2 commands",
         "# Provided by "@whook/example": 2 commands",
         "# Provided by "@whook/otel": none",
         "# Provided by "@whook/whook": 9 commands",
         "- config: A simple program that returns the queried config value",
         "- create: A command helping to create new Whook files easily",
         "- createSecretKey: A command to create a secret key",
         "- cronRun: A command to run all instances of a cron",
         "- cronSchedule: A command to run a cron schedules for a given time frame",
         "- env: A command printing env values",
         "- generateOpenAPISchema: Write openAPI schema to stdout",
         "- generateOpenAPITypes: Write openAPI types to stdout",
         "- generateSchemaValidators: Build the schema validators with AJV",
         "- inspect: A simple program that returns the result of the injected service",
         "- ls: Print available commands",
         "- printEnv: A command printing every env values",
         "- route: Runs the given server route for testing purpose",
       ],
     }
    `);
  });

  test('with env', async () => {
    const { stdout, stderr } = await execCommand(
      'NO_PROMPT=1 npm run whook --silent -- env --name NODE_ENV',
    );

    expect({
      stdout: replacePaths(stdout),
      stderr: replacePaths(stderr),
    }).toMatchInlineSnapshot(`
     {
       "stderr": "⚡ - Loading configurations from "file:///project/dist/config/local/config.js".
     🤖 - Initializing the \`$autoload\` service.
     🔴 - Running with "local" application environment.
     🔂 - Running with "test" node environment.
     ➕ - Wrapping definitions for CORS.
     🖃 - Initializing the validators service.
     🏭 - Initializing the COMMANDS_WRAPPERS service.
     💾 - Loading the TypeScript project.
     ✅ - Loaded the TypeScript project.
     🏭 - Initializing the COMMANDS_HANDLERS service with 13 handlers and wrapCommandHandlerForDebug wrappers.
     On air 🚀🌕
     ",
       "stdout": "test
     ",
     }
    `);
  });

  test('with config', async () => {
    const { stdout, stderr } = await execCommand(
      'NO_PROMPT=1 npm run whook --silent -- config --name DEFAULT_MECHANISM',
    );

    expect({
      stdout: replacePaths(stdout),
      stderr: replacePaths(stderr),
    }).toMatchInlineSnapshot(`
     {
       "stderr": "⚡ - Loading configurations from "file:///project/dist/config/local/config.js".
     🤖 - Initializing the \`$autoload\` service.
     🔴 - Running with "local" application environment.
     🔂 - Running with "test" node environment.
     ➕ - Wrapping definitions for CORS.
     🖃 - Initializing the validators service.
     🏭 - Initializing the COMMANDS_WRAPPERS service.
     💾 - Loading the TypeScript project.
     ✅ - Loaded the TypeScript project.
     🏭 - Initializing the COMMANDS_HANDLERS service with 13 handlers and wrapCommandHandlerForDebug wrappers.
     On air 🚀🌕
     ",
       "stdout": ""Fake"
     ",
     }
    `);
  });
});

async function execCommand(
  command: string,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(
          YError.wrap(err as Error, 'E_COMMAND_FAILURE', [stdout, stderr]),
        );
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function replacePaths(text: string) {
  return text.replaceAll(
    joinPaths(import.meta.dirname, '..').replace(/^file:\/\//, ''),
    '/project',
  );
}
