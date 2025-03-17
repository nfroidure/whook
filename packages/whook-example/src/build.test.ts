import { describe, beforeAll, test } from '@jest/globals';
import { exec } from 'child_process';
import { YError } from 'yerror';

describe('build should work', () => {
  let env = 'JWT_SECRET=test ';

  beforeAll(async () => {
    const { stdout } = await execCommand(
      `sed -e 's/^//' .env.${process.env.NODE_ENV} || echo ""`,
    );

    env += stdout.trim();
  });

  [
    ['getPing', '{}'],
    ['getOpenAPI', '{}'],
    [
      'getParameters',
      '{ "aHeader": "true", "pathParam1":"4", "pathParam2":"a,b,c,d" }',
    ],
    ['getTime', '{}'],
    ['getDelay', '{ "duration": 1 }'],
    ['putEcho', '{"body": { "echo": "YOLO!" }}'],
  ].forEach(([operationId, parameters]) => {
    test(`with ${operationId} http lambdas`, async () => {
      await execCommand(
        `${env} npx whook testAWSLambdaRoute --name ${operationId} --parameters '${parameters}'`,
      );
    });
  });

  test(`with cron lambdas`, async () => {
    await execCommand(
      `${env} npx whook testAWSLambdaCron --name handleMinutes`,
    );
  });

  test(`with consumer lambdas`, async () => {
    await execCommand(
      `${env} npx whook testAWSLambdaConsumer --name consumeMessages --event '{ "Records": [{ "test": "test" }] }'`,
    );
  });
});

async function execCommand(
  command,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(YError.wrap(err, 'E_COMMAND_FAILURE', stdout, stderr));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}
