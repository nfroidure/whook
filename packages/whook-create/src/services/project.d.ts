import { LockService, LogService } from 'common-services';
export interface ProjectService {
  name: string;
  directory: string;
}
declare const _default: ({
  CWD,
  lock,
  inquirer,
  ensureDir,
  log,
}: {
  CWD: string;
  lock: LockService<string>;
  inquirer: any;
  ensureDir: any;
  log: LogService;
}) => Promise<ProjectService>;
export default _default;
