import { WhookDefinition } from '@whook/whook';
import { LogService } from 'common-services';
export declare const definition: WhookDefinition;
declare const _default: import('knifecycle').HandlerInitializer<
  {
    log: LogService;
  },
  [],
  {
    status: number;
    body: any;
  },
  {
    body: any;
  },
  import('knifecycle').Handler<
    {
      body: any;
    },
    [],
    {
      status: number;
      body: any;
    }
  >
>;
export default _default;
