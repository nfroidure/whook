import Knifecycle, { Services } from 'knifecycle';
export declare function runServer(
  innerPrepareEnvironment?: typeof prepareEnvironment,
  innerPrepareServer?: typeof prepareServer,
  injectedNames?: any[],
): Promise<Services<any>>;
export declare function prepareServer<S = Services>(
  injectedNames?: any[],
  $?: Knifecycle,
): Promise<S>;
export declare function prepareEnvironment($?: Knifecycle): Promise<Knifecycle>;
