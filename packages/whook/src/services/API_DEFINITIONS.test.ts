import initAPIDefinitions, {
  WhookAPIHandlerModule,
  WhookAPIHandlerDefinition,
} from './API_DEFINITIONS';
import { definition as getPingDefinition } from '../handlers/getPing';
import YError from 'yerror';

const getUserModule: WhookAPIHandlerModule = {
  definition: {
    path: '/users/{userId}',
    method: 'get',
    operation: {
      operationId: 'getUser',
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
  const require = jest.fn();
  const readDir = jest.fn();

  beforeEach(() => {
    log.mockReset();
    require.mockReset();
    readDir.mockReset();
  });

  describe('should work', () => {
    it('with no handlers', async () => {
      readDir.mockReturnValueOnce([]);
      require.mockImplementationOnce(() => {
        throw new YError('E_NOT_SUPPOSED_TO_BE_HERE');
      });

      const API_DEFINITIONS = await initAPIDefinitions({
        PROJECT_SRC,
        log,
        readDir,
        require: (require as unknown) as any,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(args => args[0].endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        requireCalls: require.mock.calls,
      }).toMatchSnapshot();
    });

    it('with a few handlers', async () => {
      readDir.mockReturnValueOnce(['getPing', 'getUser']);
      require.mockReturnValueOnce({
        definition: getPingDefinition,
      });
      require.mockReturnValueOnce(getUserModule);

      const API_DEFINITIONS = await initAPIDefinitions({
        PROJECT_SRC,
        log,
        readDir,
        require: (require as unknown) as any,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(args => args[0].endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        requireCalls: require.mock.calls,
      }).toMatchSnapshot();
    });

    it('with a several handlers at the same path', async () => {
      readDir.mockReturnValueOnce(['getUser', 'putUser']);
      require.mockReturnValueOnce(getUserModule);
      require.mockReturnValueOnce(putUserModule);

      const API_DEFINITIONS = await initAPIDefinitions({
        PROJECT_SRC,
        log,
        readDir,
        require: (require as unknown) as any,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(args => args[0].endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        requireCalls: require.mock.calls,
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
      require.mockReturnValueOnce(getUserModuleDisabled);
      require.mockReturnValueOnce(putUserModule);

      const API_DEFINITIONS = await initAPIDefinitions({
        PROJECT_SRC,
        log,
        readDir,
        require: (require as unknown) as any,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(args => args[0].endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        requireCalls: require.mock.calls,
      }).toMatchSnapshot();
    });
  });
});
