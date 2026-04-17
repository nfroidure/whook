import { describe, test, expect } from '@jest/globals';
import { refersTo } from './openapi.js';
import {
  type WhookAPISchemaDefinition,
  type WhookAPIParameterDefinition,
  type WhookAPIExampleDefinition,
  type WhookAPIHeaderDefinition,
  type WhookAPIResponseDefinition,
  type WhookAPIRequestBodyDefinition,
  type WhookAPICallbackDefinition,
} from '../types/openapi.js';

describe('refersTo', () => {
  test('should create a reference for schema definitions', () => {
    const schema: WhookAPISchemaDefinition<unknown> = {
      name: 'User',
      schema: { type: 'string' },
    };
    const result = refersTo(schema);

    expect(result.$ref).toBe('#/components/schemas/User');
  });

  test('should create a reference for parameter definitions', () => {
    const parameter: WhookAPIParameterDefinition<unknown> = {
      name: 'userId',
      parameter: {
        name: 'userId',
        in: 'path',
        schema: { type: 'string' },
      },
    };
    const result = refersTo(parameter);

    expect(result.$ref).toBe('#/components/parameters/userId');
  });

  test('should create a reference for header definitions', () => {
    const header: WhookAPIHeaderDefinition = {
      name: 'X-Token',
      header: {
        schema: { type: 'string' },
      },
    };
    const result = refersTo(header);

    expect(result.$ref).toBe('#/components/headers/X-Token');
  });

  test('should create a reference for response definitions', () => {
    const response: WhookAPIResponseDefinition = {
      name: 'NotFound',
      response: {},
    };
    const result = refersTo(response);

    expect(result.$ref).toBe('#/components/responses/NotFound');
  });

  test('should create a reference for request body definitions', () => {
    const requestBody: WhookAPIRequestBodyDefinition = {
      name: 'UserBody',
      requestBody: {
        content: {
          'application/json': {
            schema: { type: 'string' },
          },
        },
      },
    };
    const result = refersTo(requestBody);

    expect(result.$ref).toBe('#/components/requestBodies/UserBody');
  });

  test('should create a reference for callback definitions', () => {
    const callback: WhookAPICallbackDefinition = {
      name: 'ProgressCallback',
      callback: {},
    };
    const result = refersTo(callback);

    expect(result.$ref).toBe('#/components/callbacks/ProgressCallback');
  });

  test('should create a reference for example definitions', () => {
    const example: WhookAPIExampleDefinition<string> = {
      name: 'UserExample',
      example: 'example',
    };
    const result = refersTo(example);

    expect(result.$ref).toBe('#/components/examples/UserExample');
  });
});
