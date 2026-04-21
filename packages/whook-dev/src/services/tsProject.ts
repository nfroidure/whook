import { join } from 'node:path';
import { autoService, location, name } from 'knifecycle';
import { type LogService } from 'common-services';
import { Project } from 'ts-morph';

export type TSProjectService = Project;
export interface TSProjectDependencies {
  PROJECT_DIR: string;
  log: LogService;
}

async function initTSProject({
  PROJECT_DIR,
  log,
}: TSProjectDependencies): Promise<TSProjectService> {
  log('warning', `💾 - Loading the TypeScript project.`);
  const tsProject = new Project({
    tsConfigFilePath: join(PROJECT_DIR, 'tsconfig.json'),
  });

  log('warning', `✅ - Loaded the TypeScript project.`);

  return tsProject;
}

export default location(
  name('tsProject', autoService(initTSProject)),
  import.meta.url,
);
