import { service, location } from 'knifecycle';
import { log } from 'node:console';

export default location(
  service(async () => log, 'log'),
  import.meta.url,
);
