import { describe, test, expect, jest } from '@jest/globals';
import { exec } from 'node:child_process';
import { YError } from 'yerror';
import { join as joinPaths } from 'node:path';

jest.setTimeout(30000);

describe('commands should work', () => {
  test('with ls', async () => {
    const { stdout, stderr } = await execCommand(
      'npm run whook --silent -- ls',
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
✔ - Found a free port "8000"
On air 🚀🌕
",
  "stdout": "

# Provided by "@whook/example": 1 commands
- printEnv: A command printing every env values


# Provided by "@whook/whook": 9 commands
- config: A simple program that returns the queried config value
- cronRun: A command to run all instances of a cron
- cronSchedule: A command to run a cron schedules for a given time frame
- env: A command printing env values
- generateOpenAPISchema: Write openAPI schema to stdout
- generateOpenAPITypes: Write openAPI types to stdout
- inspect: A simple program that returns the result of the injected service
- ls: Print available commands
- route: Runs the given server route for testing purpose


# Provided by "@whook/cors": none


# Provided by "@whook/authorization": none
",
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
✔ - Found a free port "8000"
On air 🚀🌕
",
  "stdout": "test
",
}
`);
  });

  test('with config', async () => {
    const { stdout, stderr } = await execCommand(
      'NO_PROMPT=1 npm run whook --silent -- config --name HOST',
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
✔ - Found a free port "8000"
On air 🚀🌕
",
  "stdout": ""localhost"
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
        reject(YError.wrap(err as Error, 'E_COMMAND_FAILURE', stdout, stderr));
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
