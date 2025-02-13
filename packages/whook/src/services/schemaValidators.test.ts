import {
  describe,
  test,
  beforeAll,
  beforeEach,
  jest,
  expect,
} from '@jest/globals';
import { type LogService } from 'common-services';
import initSchemaValidators from './schemaValidators.js';
import { NodeEnv } from 'application-services';
import { OpenAPI } from 'ya-open-api-types';

const API: OpenAPI = {
  openapi: '3.1',
  info: {
    title: 'Test',
    version: '0.0.0',
  },
  paths: {
    '/test': {
      description: 'Test',
      get: {
        parameters: [
          {
            $ref: '#/components/parameters/TestParameterAlias',
          },
        ],
      },
    },
  },
  components: {
    parameters: {
      TestParameter: {
        name: 'test',
        in: 'query',
        schema: {
          $ref: '#/components/schemas/TestSchema',
        },
      },
      TestParameterAlias: {
        $ref: '#/components/parameters/TestParameter',
      },
    },
    schemas: {
      TestSchema: {
        type: 'string',
      },
    },
  },
};

const referringSchema = {
  type: 'array',
  items: {
    $ref: '#/components/schemas/TestSchema',
  },
};

describe('Validators service', () => {
  const log = jest.fn<LogService>();
  let schemaValidators;

  describe('with defaults', () => {
    beforeAll(async () => {
      schemaValidators = await initSchemaValidators({
        ENV: {
          NODE_ENV: NodeEnv.Test,
        },
        DEBUG_NODE_ENVS: ['test'],
        API,
        log,
      });
    });

    beforeEach(async () => {
      log.mockReset();
    });

    describe('should work', () => {
      test('with booleans', () => {
        expect(schemaValidators(true)).toBeDefined();
        expect(schemaValidators(false)).toBeDefined();
        expect(schemaValidators(false) === schemaValidators(false)).toBe(true);
        expect(schemaValidators(true) === schemaValidators(true)).toBe(true);
      });

      test('with $ref', () => {
        expect(
          schemaValidators({
            $ref: '#/components/schemas/TestSchema',
          }),
        ).toBeDefined();
        expect(
          schemaValidators({
            $ref: '#/components/schemas/TestSchema',
          }) ===
            schemaValidators({
              $ref: '#/components/schemas/TestSchema',
            }),
        ).toBe(true);
        expect(
          schemaValidators({
            $ref: '#/components/schemas/TestSchema',
          })('test'),
        ).toMatchInlineSnapshot(`true`);
        expect(
          schemaValidators({
            $ref: '#/components/schemas/TestSchema',
          })(12434),
        ).toMatchInlineSnapshot(`false`);
      });

      test('with raw schemas', () => {
        expect(schemaValidators({ type: 'number' })).toBeDefined();
        expect(
          schemaValidators({ type: 'number' }) !==
            schemaValidators({ type: 'number' }),
        ).toBe(true);
        expect(schemaValidators({ type: 'number' })(1234)).toBe(true);
        expect(schemaValidators({ type: 'number' })('1234')).toBe(false);
      });

      test('with raw schemas referring to openapi ones', () => {
        expect(schemaValidators(referringSchema)).toBeDefined();
        // Seems that for this case Ajv deduplicates schemas
        // expect(
        //   schemaValidators(referringSchema) === schemaValidators(referringSchema),
        // ).toBe(true);
        expect(schemaValidators(referringSchema)(['1234'])).toBe(true);
        expect(schemaValidators(referringSchema)([1234])).toBe(false);
      });
    });
  });

  describe('with optimistic set to false and lazy set to true', () => {
    beforeAll(async () => {
      schemaValidators = await initSchemaValidators({
        ENV: {
          NODE_ENV: NodeEnv.Test,
        },
        DEBUG_NODE_ENVS: ['test'],
        SCHEMA_VALIDATORS_OPTIONS: {
          lazy: true,
          optimistic: false,
        },
        API,
        log,
      });
    });

    beforeEach(async () => {
      log.mockReset();
    });

    describe('should work', () => {
      test('with booleans', () => {
        expect(schemaValidators(true)).toBeDefined();
        expect(schemaValidators(false)).toBeDefined();
        expect(schemaValidators(false) === schemaValidators(false)).toBe(true);
        expect(schemaValidators(true) === schemaValidators(true)).toBe(true);
      });

      test('with $ref', () => {
        expect(
          schemaValidators({
            $ref: '#/components/schemas/TestSchema',
          }),
        ).toBeDefined();
        expect(
          schemaValidators({
            $ref: '#/components/schemas/TestSchema',
          }) ===
            schemaValidators({
              $ref: '#/components/schemas/TestSchema',
            }),
        ).toBe(true);
        expect(
          schemaValidators({
            $ref: '#/components/schemas/TestSchema',
          })('test'),
        ).toMatchInlineSnapshot(`true`);
        expect(
          schemaValidators({
            $ref: '#/components/schemas/TestSchema',
          })(12434),
        ).toMatchInlineSnapshot(`false`);
      });

      test('with raw schemas', () => {
        expect(schemaValidators({ type: 'number' })).toBeDefined();
        expect(
          schemaValidators({ type: 'number' }) ===
            schemaValidators({ type: 'number' }),
        ).toBe(true);
        expect(schemaValidators({ type: 'number' })(1234)).toBe(true);
        expect(schemaValidators({ type: 'number' })('1234')).toBe(false);
      });

      test('with raw schemas referring to openapi ones', () => {
        expect(schemaValidators(referringSchema)).toBeDefined();
        expect(
          schemaValidators(referringSchema) ===
            schemaValidators(referringSchema),
        ).toBe(true);
        expect(schemaValidators(referringSchema)(['1234'])).toBe(true);
        expect(schemaValidators(referringSchema)([1234])).toBe(false);
      });
    });
  });
});
