import { exec } from 'child_process';

describe('build should work', () => {
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
    it(`with ${operationId} http lambdas`, async () => {
      await execCommand(
        `npx whook testHTTPLambda --name ${operationId} -- parameters '${parameters}'`,
      );
    });
  });

  it(`with cron lambdas`, async () => {
    await execCommand(`npx whook testCronLambda --name handleMinutes`);
  });

  it(`with consumer lambdas`, async () => {
    await execCommand(
      `npx whook testConsumerLambda --name handleMessages --event '{ "Records": [{ "test": "test" }] }'`,
    );
  });
});

async function execCommand(
  command,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}
