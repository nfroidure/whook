import { describe, test, expect } from '@jest/globals';
import { exec } from 'node:child_process';
import { YError } from 'yerror';

describe('commands should work', () => {
  test('with ls', async () => {
    const { stdout, stderr } = await execCommand(
      'npm run whook --silent -- ls',
    );

    expect({
  stdout: stdout.replace(/( |"|')([^ ]+)\/whook\//g, ' /whook/'),
  stderr: stderr.replace(/( |"|')([^ ]+)\/whook\//g, ' /whook/')
}).toMatchInlineSnapshot(`
{
  "stderr": "⚡ - Loading configurations from /whook/packages/whook-example/dist/config/local/config.js".
🤖 - Initializing the \`$autoload\` service.
🔴 - Running with "local" application environment.
🔂 - Running with "test" node environment.
✔ - Found a free port "8000"
On air 🚀🌕
",
  "stdout": "

# Provided by "@whook/example": 1 commands
- printEnv: A command printing every env values


# Provided by "@whook/whook": 7 commands
- config: A simple program that returns the queryed config value
- env: A command printing env values
- generateOpenAPISchema: Write openAPI schema to stdout
- generateOpenAPITypes: Write openAPI types to stdout
- handler: Runs the given server handler for testing purpose
- inspect: A simple program that returns the result of the injected service
- ls: Print available commands


# Provided by "@whook/cors": none


# Provided by "@whook/authorization": none
",
}
`);
  });

  test('with env', async () => {
    const { stdout, stderr } = await execCommand(
      'npm run whook --silent -- env --name NODE_ENV',
    );

    expect({
      stdout: stdout.replace(/( |"|')([^ ]+)\/whook\//g, ' /whook/'),
      stderr: stderr.replace(/( |"|')([^ ]+)\/whook\//g, ' /whook/'),
    }).toMatchInlineSnapshot(`
{
  "stderr": "⚡ - Loading configurations from /whook/packages/whook-example/dist/config/local/config.js".
🤖 - Initializing the \`$autoload\` service.
🔴 - Running with "local" application environment.
🔂 - Running with "test" node environment.
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
      'npm run whook --silent -- config --name HOST',
    );

    expect({
      stdout: stdout.replace(/( |"|')([^ ]+)\/whook\//g, ' /whook/'),
      stderr: stderr.replace(/( |"|')([^ ]+)\/whook\//g, ' /whook/'),
    }).toMatchInlineSnapshot(`
{
  "stderr": "⚡ - Loading configurations from /whook/packages/whook-example/dist/config/local/config.js".
🤖 - Initializing the \`$autoload\` service.
🔴 - Running with "local" application environment.
🔂 - Running with "test" node environment.
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
