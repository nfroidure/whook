import {
  WhookResponse,
  WhookAPIHandlerDefinition,
  WhookAPIParameterDefinition,
} from '@whook/whook';
import { DelayService } from 'common-services';
export declare const durationParameter: WhookAPIParameterDefinition;
export declare const definition: WhookAPIHandlerDefinition;
declare const _default: import('knifecycle').HandlerInitializer<
  {
    delay: DelayService;
  },
  [],
  WhookResponse<200, {}, undefined>,
  {
    duration: number;
  },
  import('knifecycle').Handler<
    {
      duration: number;
    },
    [],
    WhookResponse<200, {}, undefined>
  >
>;
export default _default;
