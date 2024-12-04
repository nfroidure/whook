import { location, service } from 'knifecycle';
import { exit } from 'node:process';

export default location(
  service(async () => exit, 'exit', [], true),
  import.meta.url,
);
