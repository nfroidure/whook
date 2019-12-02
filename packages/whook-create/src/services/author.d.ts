/// <reference types="node" />
import { exec as _exec } from 'child_process';
import { LockService, LogService } from 'common-services';
export interface AuthorService {
  name: string;
  email: string;
}
declare const _default: ({
  inquirer,
  exec,
  lock,
  log,
}: {
  inquirer: any;
  exec: typeof _exec;
  lock: LockService<string>;
  log: LogService;
}) => Promise<AuthorService>;
export default _default;
