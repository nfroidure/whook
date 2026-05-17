import { Knifecycle } from 'knifecycle';
import { describe, test, expect } from '@jest/globals';
import { DEFAULT_SCHEMA_VALIDATORS_OPTIONS } from '@whook/whook';
import { prepareBuildEnvironment, buildHandlerIndex } from './index.js';

describe('prepareBuildEnvironment', () => {
  test('should work', async () => {
    const $ = await prepareBuildEnvironment(new Knifecycle());

    expect($).toBeDefined();
  });
});

describe('buildHandlerIndex', () => {
  test('should build a default export for a single handler', async () => {
    const indexContents = await buildHandlerIndex({
      SCHEMA_VALIDATORS_OPTIONS: DEFAULT_SCHEMA_VALIDATORS_OPTIONS,
      handlerNames: ['getPing'],
    });

    expect(indexContents).toContain("export const getPing = async");
    expect(indexContents).toContain('export const handler = getPing;');
    expect(indexContents).toContain('export default handler;');
  });

  test('should build several named handlers in the same lambda', async () => {
    const indexContents = await buildHandlerIndex({
      SCHEMA_VALIDATORS_OPTIONS: DEFAULT_SCHEMA_VALIDATORS_OPTIONS,
      handlerNames: ['postPing', 'getPing'],
    });

    expect(indexContents).toContain("export const getPing = async");
    expect(indexContents).toContain("export const postPing = async");
    expect(indexContents).toContain('export const handler = getPing;');
    expect(indexContents).toContain(
      "return await services['MAIN_HANDLER_postPing'](event, context);",
    );
  });
});
