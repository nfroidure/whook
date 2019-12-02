/// <reference types="node" />
/// <reference types="jest" />
import _ora from 'ora';
import { exec as _exec } from 'child_process';
import { LogService } from 'common-services';
import { ProjectService } from './project';
import { AuthorService } from './author';
export declare type CreateWhookService = () => Promise<void>;
declare const _default: ({
  CWD,
  SOURCE_DIR,
  author,
  project,
  writeFile,
  readFile,
  exec,
  copy,
  require,
  axios,
  ora,
  log,
}: {
  CWD: string;
  SOURCE_DIR: string;
  author: AuthorService;
  project: ProjectService;
  writeFile: any;
  readFile: any;
  exec: typeof _exec;
  copy: any;
  require: NodeRequire;
  axios?: import('axios').AxiosStatic;
  ora?: {
    (options?: string | _ora.Options): _ora.Ora;
    promise(
      action: PromiseLike<unknown>,
      options?: string | _ora.Options,
    ): _ora.Ora;
    default: any;
  };
  log?: LogService;
}) => Promise<CreateWhookService>;
export default _default;
