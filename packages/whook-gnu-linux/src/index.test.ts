import { describe, test, expect } from '@jest/globals';
import {
  initGenerateGNULinuxCrontabCommand,
  initGenerateGNULinuxSystemdCronsCommand,
  initGenerateGNULinuxSystemdDaemonCommand,
  initGenerateGNULinuxLogrotateCommand,
} from './index.js';

describe('index', () => {
  test('should export all command initializers', () => {
    expect(initGenerateGNULinuxCrontabCommand).toBeDefined();
    expect(initGenerateGNULinuxSystemdCronsCommand).toBeDefined();
    expect(initGenerateGNULinuxSystemdDaemonCommand).toBeDefined();
    expect(initGenerateGNULinuxLogrotateCommand).toBeDefined();
  });
});
