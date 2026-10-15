import { describe, test, expect } from '@jest/globals';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import initCreateDirectoryFilesWalker from './createDirectoryFilesWalker.js';
import { pathToFileURL } from 'node:url';

describe('initCreateDirectoryFilesWalker', () => {
  test('should recursively find files', async () => {
    const root = await mkdtemp(join(tmpdir(), 'walker-'));

    await writeFile(join(root, 'a.txt'), '');
    await mkdir(join(root, 'sub'));
    await writeFile(join(root, 'sub', 'b.txt'), '');

    const createDirectoryFilesWalker = await initCreateDirectoryFilesWalker({});

    const files: string[] = [];
    const directoryFilesWalker = createDirectoryFilesWalker(
      pathToFileURL(root),
    );

    for await (const file of directoryFilesWalker) {
      files.push(file.toString());
    }

    expect(files.sort()).toEqual([
      pathToFileURL(join(root, 'a.txt')).toString(),
      pathToFileURL(join(root, 'sub', 'b.txt')).toString(),
    ]);
  });
});
