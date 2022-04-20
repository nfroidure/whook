import initPORT from './PORT';
import initImporter from './importer';
import type { PortFinderModule } from './PORT';

describe('initPORT', () => {
  const log = jest.fn();

  beforeEach(() => {
    log.mockReset();
  });

  it('should use the env port first', async () => {
    const importer = await initImporter<PortFinderModule>({ log });
    const port = await initPORT({
      ENV: { PORT: '1337' },
      importer,
      log,
    });

    expect({
      port,
    }).toMatchInlineSnapshot(`
      Object {
        "port": 1337,
      }
    `);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should find a port by itself if no env port', async () => {
    const importer = await initImporter<PortFinderModule>({ log });
    const port = await initPORT({
      importer,
      log,
    });

    expect(port).toBeGreaterThan(0);
    expect({
      logCalls: log.mock.calls
        .filter((args) => 'stack' !== args[0])
        .map(([arg1, arg2, ...args]) => {
          return [arg1, arg2.replace(/port (\d+)/, 'port ${PORT}'), ...args];
        }),
    }).toMatchSnapshot();
  });
});
