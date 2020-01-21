import { exec } from 'child_process';

describe('commands should work', () => {
  it('with ls', async () => {
    const { stdout, stderr } = await execCommand(
      'npm run whook --silent -- ls',
    );

    expect({
      stdout,
      stderr: stderr.replace(/ ([^ ]+)\/whook\//, ' /whook/'),
    }).toMatchSnapshot();
  });

  it('with env', async () => {
    const { stdout, stderr } = await execCommand(
      'npm run whook --silent -- env --name NODE_ENV',
    );

    expect({
      stdout,
      stderr: stderr.replace(/ ([^ ]+)\/whook\//, ' /whook/'),
    }).toMatchSnapshot();
  });

  it('with config', async () => {
    const { stdout, stderr } = await execCommand(
      'npm run whook --silent -- config --name BASE_PATH',
    );

    expect({
      stdout,
      stderr: stderr.replace(/ ([^ ]+)\/whook\//, ' /whook/'),
    }).toMatchSnapshot();
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
