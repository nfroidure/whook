import { service, location } from 'knifecycle';
import { log } from 'node:console';

export default location(
  service(async () => log, 'rawLog'),
  import.meta.url,
);
