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
        `JWT_SECRET=test npx whook testHTTPFunction --name ${operationId} --parameters '${parameters}'`,
      );
    });
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
