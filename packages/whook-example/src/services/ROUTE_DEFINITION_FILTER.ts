import { name, autoService, location } from 'knifecycle';
import {
  noop,
  identity,
  type WhookRouteDefinitionFilter,
  type WhookRouteDefinition,
} from '@whook/whook';
import { type LogService } from 'common-services';

export default location(
  name('ROUTE_DEFINITION_FILTER', autoService(initFilterAPIDefinition)),
  import.meta.url,
);

export type RouteDefinitionFilterEnvVars = {
  FILTER_ROUTE_TAGS?: string;
};

/* Architecture Note #4.2: filterAPITags

Small tweak to be able to run only parts of the API
 by filtering endpoints via their tags. This makes of
 this example an anylith (a monolith that can split
 at will into micro-services).

For example, to create a server with only `system` and
 `example` tagged endpoints, juste do this:
```sh
FILTER_ROUTE_TAGS=system,example npm start
```
*/
async function initFilterAPIDefinition({
  ENV,
  log = noop,
}: {
  ENV: RouteDefinitionFilterEnvVars;
  log: LogService;
}): Promise<WhookRouteDefinitionFilter> {
  const FILTER_ROUTE_TAGS = (ENV.FILTER_ROUTE_TAGS || '')
    .split(',')
    .filter(identity);

  if (FILTER_ROUTE_TAGS.length > 0) {
    log('warning', `⏳ - Filtering API with (${FILTER_ROUTE_TAGS}) tags!`);
    return (definition: WhookRouteDefinition) => {
      return !FILTER_ROUTE_TAGS.some((tag) =>
        (definition.operation.tags || []).includes(tag),
      );
    };
  }

  return () => false;
}
