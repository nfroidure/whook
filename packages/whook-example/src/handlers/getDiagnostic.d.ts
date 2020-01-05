import { WhookAPIHandlerDefinition, WhookResponse } from '@whook/whook';
export declare const definition: WhookAPIHandlerDefinition;
declare const _default: import('knifecycle').HandlerInitializer<
  {
    TRANSACTIONS: {};
  },
  [],
  WhookResponse<
    number,
    {
      [name: string]: string;
    },
    any
  >,
  import('knifecycle').Parameters,
  import('knifecycle').Handler<
    import('knifecycle').Parameters,
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
