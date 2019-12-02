import { WhookResponse, WhookDefinition } from '@whook/whook';
import { DelayService } from 'common-services';
export declare const definition: WhookDefinition;
declare const _default: import('knifecycle').HandlerInitializer<
  {
    delay: DelayService;
  },
  [],
  WhookResponse<
    number,
    {
      [name: string]: string;
    },
    any
  >,
  {
    duration: number;
  },
  import('knifecycle').Handler<
    {
      duration: number;
    },
    [],
    WhookResponse<
      number,
      {
        [name: string]: string;
      },
      any
    >
  >
>;
export default _default;
