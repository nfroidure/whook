import { autoService, location } from 'knifecycle';
import { opendir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export type DirectoryFile = URL;
export type DirectoryFilesWalker = AsyncGenerator<DirectoryFile, void, unknown>;
export type CreateDirectoryFilesWalkerService = (
  url: URL,
) => DirectoryFilesWalker;

async function initCreateDirectoryFilesWalker(): Promise<CreateDirectoryFilesWalkerService> {
  async function* createDirectoryFilesWalker(url: URL) {
    const dir = await opendir(url, {
      recursive: true,
    });

    for await (const dirent of dir) {
      if (!dirent.isFile()) {
        continue;
      }

      yield pathToFileURL(join(dirent.parentPath, dirent.name));
    }
  }

  return createDirectoryFilesWalker;
}

export default location(
  autoService(initCreateDirectoryFilesWalker),
  import.meta.url,
);
