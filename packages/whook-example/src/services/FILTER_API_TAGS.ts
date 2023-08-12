import { name, autoService } from 'knifecycle';
import { noop, identity } from '@whook/whook';
import type { LogService } from 'common-services';

export default name('FILTER_API_TAGS', autoService(initFilterAPITags));

export type FilterAPITagsEnvVars = {
  FILTER_API_TAGS?: string;
};

/* Architecture Note #4.2: filterAPITags

Small tweak to be able to run only parts of the API
 by filtering endpoints via their tags. This makes of
 this example an anylith (a monolith that can split
 at will into micro-services).

For example, to create a server with only `system` and
 `example` tagged endpoints, juste do this:
```sh
FILTER_API_TAGS=system,example npm start
```
*/
async function initFilterAPITags({
  ENV,
  log = noop,
}: {
  ENV: FilterAPITagsEnvVars;
  log: LogService;
}): Promise<string[]> {
  const FILTER_API_TAGS = (ENV.FILTER_API_TAGS || '')
    .split(',')
    .filter(identity);

  if (FILTER_API_TAGS.length > 0) {
    log('warning', `⏳ - Filtering API with (${FILTER_API_TAGS}) tags!`);
  }

  return FILTER_API_TAGS;
}
