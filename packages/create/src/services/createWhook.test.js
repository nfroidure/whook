import initCreateWhook from './createWhook';
import YError from 'yerror';
import packageJSON from 'whook-example/package';

describe('initCreateWhook', () => {
  const CWD = '/home/whoiam/projects/';
  const SOURCE_DIR = '/var/lib/node/node_modules/whook-example';
  const author = {
    name: 'Wayne Campbell',
    email: 'wayne@warner.com',
  };
  const project = {
    name: 'super-project',
    directory: '/home/whoiam/projects/yolo',
  };
  const writeFile = jest.fn();
  const exec = jest.fn();
  const copy = jest.fn();
  const require = jest.fn();
  const log = jest.fn();

  beforeEach(() => {
    require.mockReset();
    writeFile.mockReset();
    exec.mockReset();
    copy.mockReset();
    log.mockReset();
  });

  it('should work', async () => {
    require.mockReturnValueOnce(packageJSON);
    copy.mockImplementationOnce((_, _2, { filter }) =>
      Promise.all(
        [
          'package.json',
          'package-lock.json',
          'LICENSE',
          'dist/index.js',
          'src/index.js',
          'coverage/index.html',
          'node_modules/whook/index.js',
        ].map(fileName =>
          filter(
            `${SOURCE_DIR}/${fileName}`,
            `${project.directory}/${fileName}`,
          ),
        ),
      ),
    );
    writeFile.mockResolvedValueOnce();
    writeFile.mockResolvedValueOnce();
    exec.mockImplementationOnce((_, _2, cb) =>
      cb(null, 'Initialized an empty git repository!'),
    );

    const createWhook = await initCreateWhook({
      CWD,
      SOURCE_DIR,
      author,
      project,
      writeFile,
      exec,
      copy,
      require,
      log,
    });

    await createWhook();

    expect({
      requireCalls: require.mock.calls,
      copyCalls: copy.mock.calls,
      writeFileCalls: writeFile.mock.calls,
      execCalls: exec.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchSnapshot();
  });

  it('should handle git initialization problems', async () => {
    require.mockReturnValueOnce(packageJSON);
    copy.mockResolvedValueOnce(new YError('E_ACCESS'));
    writeFile.mockResolvedValueOnce();
    writeFile.mockResolvedValueOnce();
    exec.mockImplementationOnce((_, _2, cb) => cb(new YError('E_ACCESS')));

    const createWhook = await initCreateWhook({
      CWD,
      SOURCE_DIR,
      author,
      project,
      writeFile,
      exec,
      copy,
      require,
      log,
    });

    await createWhook();

    expect({
      requireCalls: require.mock.calls,
      copyCalls: copy.mock.calls,
      writeFileCalls: writeFile.mock.calls,
      execCalls: exec.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => 'stack' !== type),
    }).toMatchSnapshot();
  });

  it('should fail with access problems', async () => {
    require.mockReturnValueOnce(packageJSON);
    copy.mockRejectedValueOnce(new YError('E_ACCESS'));
    writeFile.mockResolvedValueOnce();
    writeFile.mockResolvedValueOnce();
    exec.mockImplementationOnce((_, _2, cb) => cb(null, ''));

    try {
      const createWhook = await initCreateWhook({
        SOURCE_DIR,
        author,
        project,
        writeFile,
        exec,
        copy,
        require,
        log,
      });

      await createWhook();

      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: err.code,
        errorParams: err.params,
        requireCalls: require.mock.calls,
        copyCalls: copy.mock.calls,
        writeFileCalls: writeFile.mock.calls,
        execCalls: exec.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => 'stack' !== type),
      }).toMatchSnapshot();
    }
  });
});
