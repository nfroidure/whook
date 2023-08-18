import { service } from 'knifecycle';
import { exit } from 'node:process';

export default service(async () => exit, 'exit', [], true);
