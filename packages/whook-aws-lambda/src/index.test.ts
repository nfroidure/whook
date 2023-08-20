import { Knifecycle } from 'knifecycle';
import { describe, test, expect } from '@jest/globals';
import { prepareBuildEnvironment } from './index.js';

describe('prepareBuildEnvironment', () => {
  test('should work', async () => {
    const $ = await prepareBuildEnvironment(new Knifecycle());

    expect($).toBeDefined();
  });
});
