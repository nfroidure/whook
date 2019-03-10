import initConfigCommand from './config';
import YError from 'yerror';

describe('configCommand', () => {
  const CONFIGS = {
    MYSQL: {
      auth: {
        username: 'root',
      },
      version: '2.1.1',
    },
  };
  const log = jest.fn();

  beforeEach(() => {
    log.mockReset();
  });

  it('should work with no query at all', async () => {
    const configCommand = await initConfigCommand({
      log,
      CONFIGS,
      args: {
        _: ['config'],
        name: 'MYSQL',
      },
    });
    const result = await configCommand();

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should work with one value', async () => {
    const configCommand = await initConfigCommand({
      log,
      CONFIGS,
      args: {
        _: ['config'],
        name: 'MYSQL',
        query: 'auth.username',
      },
    });
    const result = await configCommand();

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should work with several values', async () => {
    const configCommand = await initConfigCommand({
      log,
      CONFIGS,
      args: {
        _: ['config'],
        name: 'MYSQL',
        query: 'auth.*',
      },
    });
    const result = await configCommand();

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should work with an unexisting config but a default value', async () => {
    const configCommand = await initConfigCommand({
      log,
      CONFIGS,
      args: {
        _: ['config'],
        name: 'DOES_NOT_EXIST',
        default: 'v8',
      },
    });
    const result = await configCommand();

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should work with no result but a default value', async () => {
    const configCommand = await initConfigCommand({
      log,
      CONFIGS,
      args: {
        _: ['config'],
        name: 'MYSQL',
        query: 'nothing_here',
        default: 'v8',
      },
    });
    const result = await configCommand();

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should fail with unexisting config name', async () => {
    const configCommand = await initConfigCommand({
      log,
      CONFIGS,
      args: {
        _: ['config'],
        name: 'DOES_NOT_EXIST',
      },
    });

    try {
      await configCommand();
      throw new YError('E_UNEXPEXTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: err.code,
        errorParams: err.params,
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
      }).toMatchSnapshot();
    }
  });

  it('should fail with no result', async () => {
    const configCommand = await initConfigCommand({
      log,
      CONFIGS,
      args: {
        _: ['config'],
        name: 'MYSQL',
        query: 'nothing_here',
      },
    });

    try {
      await configCommand();
      throw new YError('E_UNEXPEXTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: err.code,
        errorParams: err.params,
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
      }).toMatchSnapshot();
    }
  });
});
