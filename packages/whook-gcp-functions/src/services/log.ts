import { service } from 'knifecycle';
import { log } from 'node:console';

export default service(async () => log, 'log');
