import initAPIDefinitions from './API_DEFINITIONS';
import { definition as getPingDefinition } from '../handlers/getPing';
import YError from 'yerror';
import type { WhookAPIHandlerModule } from './API_DEFINITIONS';

const getUserModule: WhookAPIHandlerModule = {
  definition: {
    path: '/users/{userId}',
    method: 'get',
    operation: {
      operationId: 'getUser',
      tags: ['user'],
      parameters: [
        {
          $ref: `#/components/parameters/userId`,
        },
      ],
      responses: {
        200: {
          description: 'The user',
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/User`,
              },
            },
          },
        },
      },
    },
  },
  userIdParameter: {
    name: 'userId',
    parameter: {
      name: 'userId',
      in: 'path',
      schema: { type: 'number' },
    },
  },
  userSchema: {
    name: 'User',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    },
  },
};
const putUserModule: WhookAPIHandlerModule = {
  definition: {
    path: '/users/{userId}',
    method: 'put',
    operation: {
      operationId: 'putUser',
      tags: ['user'],
      parameters: [
        {
          $ref: `#/components/parameters/userId`,
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/User`,
            },
          },
        },
      },
      responses: getUserModule.definition.operation.responses,
    },
  },
};

describe('initAPIDefinitions', () => {
  const PROJECT_SRC = '/home/whoiam/project/src';
  const log = jest.fn();
  const importer = jest.fn();
  const readDir = jest.fn();

  beforeEach(() => {
    log.mockReset();
    importer.mockReset();
    readDir.mockReset();
  });

  describe('should work', () => {
    it('with no handlers', async () => {
      readDir.mockReturnValueOnce([]);
      importer.mockImplementationOnce(() => {
        throw new YError('E_NOT_SUPPOSED_TO_BE_HERE');
      });

      const API_DEFINITIONS = await initAPIDefinitions({
        PROJECT_SRC,
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchSnapshot();
    });

    it('with a few handlers', async () => {
      readDir.mockReturnValueOnce(['getPing', 'getUser']);
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
      });
      importer.mockResolvedValueOnce(getUserModule);

      const API_DEFINITIONS = await initAPIDefinitions({
        PROJECT_SRC,
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchSnapshot();
    });

    it('with a few handlers in different plugins paths', async () => {
      readDir.mockReturnValueOnce(['getPing']);
      readDir.mockReturnValueOnce(['getUser']);
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
      });
      importer.mockResolvedValueOnce(getUserModule);

      const API_DEFINITIONS = await initAPIDefinitions({
        PROJECT_SRC,
        WHOOK_PLUGINS_PATHS: ['/home/whoiam/project/node_modules/@whook/dist'],
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchSnapshot();
    });

    it('with a few handlers in different plugins paths and an overriden one', async () => {
      readDir.mockReturnValueOnce(['getPing']);
      readDir.mockReturnValueOnce(['getPing', 'getUser']);
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
      });
      importer.mockResolvedValueOnce(getUserModule);
      importer.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE'));

      const API_DEFINITIONS = await initAPIDefinitions({
        PROJECT_SRC,
        WHOOK_PLUGINS_PATHS: ['/home/whoiam/project/node_modules/@whook/dist'],
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchSnapshot();
    });

    it('with a few handlers in different plugins paths and an overriden one but with a different extension', async () => {
      readDir.mockReturnValueOnce(['getPing.ts']);
      readDir.mockReturnValueOnce(['getPing', 'getUser']);
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
      });
      importer.mockResolvedValueOnce(getUserModule);
      importer.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE'));

      const API_DEFINITIONS = await initAPIDefinitions({
        PROJECT_SRC,
        WHOOK_PLUGINS_PATHS: ['/home/whoiam/project/node_modules/@whook/dist'],
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchSnapshot();
    });

    it('with a several handlers at the same path', async () => {
      readDir.mockReturnValueOnce(['getUser', 'putUser']);
      importer.mockResolvedValueOnce(getUserModule);
      importer.mockResolvedValueOnce(putUserModule);

      const API_DEFINITIONS = await initAPIDefinitions({
        PROJECT_SRC,
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchSnapshot();
    });

    it('with a disabled handler at the same path', async () => {
      const getUserModuleDisabled: WhookAPIHandlerModule = {
        ...getUserModule,
        definition: {
          ...getUserModule.definition,
          operation: {
            ...getUserModule.definition.operation,
            'x-whook': {
              disabled: true,
            },
          },
        },
      };
      readDir.mockReturnValueOnce(['getUser', 'putUser']);
      importer.mockResolvedValueOnce(getUserModuleDisabled);
      importer.mockResolvedValueOnce(putUserModule);

      const API_DEFINITIONS = await initAPIDefinitions({
        PROJECT_SRC,
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchSnapshot();
    });

    it('with a filtered handler', async () => {
      const getUserModuleDisabled: WhookAPIHandlerModule = {
        ...getUserModule,
        definition: {
          ...getUserModule.definition,
          operation: {
            ...getUserModule.definition.operation,
            tags: ['other'],
          },
        },
      };
      readDir.mockReturnValueOnce(['getUser', 'putUser']);
      importer.mockResolvedValueOnce(getUserModuleDisabled);
      importer.mockResolvedValueOnce(putUserModule);

      const API_DEFINITIONS = await initAPIDefinitions({
        PROJECT_SRC,
        FILTER_API_TAGS: ['user'],
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchSnapshot();
    });
  });
});
