import { describe, it } from '@jest/globals';
import initLogService from './log.js';

describe('initLogService', () => {
  it('should work', async () => {
    await initLogService({});
  });
});
