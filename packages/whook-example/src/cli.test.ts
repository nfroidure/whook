import { describe, it, expect } from '@jest/globals';
import { exec } from 'child_process';
import { YError } from 'yerror';

describe('commands should work', () => {
  it('with ls', async () => {
    const { stdout, stderr } = await execCommand(
      'npm run whook --silent -- ls',
    );

    expect({
      stdout: stdout.replace(/( |"|')([^ ]+)\/whook\//g, ' /whook/'),
      stderr: stderr.replace(/( |"|')([^ ]+)\/whook\//g, ' /whook/'),
    }).toMatchInlineSnapshot(`
{
  "stderr": "⚡ - Loading configurations from /whook/packages/whook-example/dist/config/local/config.js".
",
  "stdout": "

# Provided by "@whook/example": 2 commands
- printEnv: A command printing every env values
- terraformValues: A command printing lambdas informations for Terraform


# Provided by "@whook/whook": 8 commands
- config: A simple program that returns the queryed config value
- create: A command helping to create new Whook files easily
- env: A command printing env values
- generateOpenAPISchema: Write openAPI schema to stdout
- generateOpenAPITypes: Write openAPI types to stdout
- handler: Runs the given server handler for testing purpose
- inspect: A simple program that returns the result of the injected service
- ls: Print available commands


# Provided by "@whook/cors": none


# Provided by "@whook/authorization": none


# Provided by "@whook/aws-lambda": 7 commands
- testConsumerLambda: A command for testing AWS consumer lambda
- testCronLambda: A command for testing AWS cron lambda
- testHTTPLambda: A command for testing AWS HTTP lambda
- testKafkaConsumerLambda: A command for testing AWS lambda Kafka consumers
- testS3Lambda: A command for testing AWS consumer lambda
- testS3Lambda: A command for testing AWS consumer lambda
- testTransformerLambda: A command for testing AWS lambda transformers
",
}
`);
  });

  it('with env', async () => {
    const { stdout, stderr } = await execCommand(
      'npm run whook --silent -- env --name NODE_ENV',
    );

    expect({
      stdout: stdout.replace(/( |"|')([^ ]+)\/whook\//g, ' /whook/'),
      stderr: stderr.replace(/( |"|')([^ ]+)\/whook\//g, ' /whook/'),
    }).toMatchInlineSnapshot(`
{
  "stderr": "⚡ - Loading configurations from /whook/packages/whook-example/dist/config/local/config.js".
🔴 - Running with "local" application environment.
🔂 - Running with "test" node environment.
",
  "stdout": "test
",
}
`);
  });

  it('with config', async () => {
    const { stdout, stderr } = await execCommand(
      'npm run whook --silent -- config --name HOST',
    );

    expect({
      stdout: stdout.replace(/( |"|')([^ ]+)\/whook\//g, ' /whook/'),
      stderr: stderr.replace(/( |"|')([^ ]+)\/whook\//g, ' /whook/'),
    }).toMatchInlineSnapshot(`
{
  "stderr": "⚡ - Loading configurations from /whook/packages/whook-example/dist/config/local/config.js".
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
