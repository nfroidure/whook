import { describe, test, expect } from '@jest/globals';
import { parseArgs } from './args.js';

describe('parseArgs', () => {
  test('should parse args', async () => {
    const args = await parseArgs([
      'whook',
      'handler',
      '--name',
      'getPing',
      '--parameters',
      '{}',
    ]);

    expect(args).toMatchInlineSnapshot(`
{
  "command": "handler",
  "namedArguments": {
    "name": "getPing",
    "parameters": "{}",
  },
  "rest": [],
}
`);
  });
});
