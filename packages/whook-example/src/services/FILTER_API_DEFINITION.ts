import { name, autoService, location } from 'knifecycle';
import { noop, identity } from '@whook/whook';
import type { LogService } from 'common-services';
import type {
  WhookAPIHandlerDefinition,
  WhookAPIDefinitionFilter,
} from '@whook/whook';

export default location(
  name('FILTER_API_DEFINITION', autoService(initFilterAPIDefinition)),
  import.meta.url,
);

export type FilterAPIDefinitionEnvVars = {
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
async function initFilterAPIDefinition({
  ENV,
  log = noop,
}: {
  ENV: FilterAPIDefinitionEnvVars;
  log: LogService;
}): Promise<WhookAPIDefinitionFilter> {
  const FILTER_API_TAGS = (ENV.FILTER_API_TAGS || '')
    .split(',')
    .filter(identity);

  if (FILTER_API_TAGS.length > 0) {
    log('warning', `⏳ - Filtering API with (${FILTER_API_TAGS}) tags!`);
    return (definition: WhookAPIHandlerDefinition) => {
      return !FILTER_API_TAGS.some((tag) =>
        (definition.operation.tags || []).includes(tag),
      );
    };
  }

  return () => false;
}
