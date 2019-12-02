import { WhookResponse, WhookDefinition } from '..';
export declare const definition: WhookDefinition;
declare const _default: import('knifecycle').HandlerInitializer<
  {
    NODE_ENV: string;
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
