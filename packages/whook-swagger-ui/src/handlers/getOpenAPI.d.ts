import { WhookAPIHandlerDefinition } from '@whook/whook';
declare const _default: import('knifecycle').HandlerInitializer<
  {
    API: any;
  },
  [],
  {
    status: number;
    body: any;
  },
  {
    authenticated?: boolean;
    mutedMethods?: string[];
  },
  import('knifecycle').Handler<
    {
      authenticated?: boolean;
      mutedMethods?: string[];
    },
    [],
    {
      status: number;
      body: any;
    }
  >
>;
export default _default;
export declare const definition: WhookAPIHandlerDefinition;
