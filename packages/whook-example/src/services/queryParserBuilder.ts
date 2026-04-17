import { type LogService } from 'common-services';
import {
  initQueryParserBuilder as baseInitQueryParserBuilder,
  type WhookOpenAPI,
} from '@whook/whook';
import { autoService, location } from 'knifecycle';

/* Architecture Note #4.5: queryParserBuilder

Thanks to the DI system, you can easily customize
 Whook building blocks to match your flavor. Here,
 we override the default query parser behavior to
 be less strict than the `strict-qs` module
 set up per default.

You can navigate through the Whook's sources to
 get the overall list of its services. Another
 way is to run the server with the `DEBUG=knifecycle`
 environment variable to see what happens under the
 hood, in the DI system.
*/
async function initQueryParserBuilder({
  API,
  log,
}: {
  API: WhookOpenAPI;
  log: LogService;
}) {
  log('warning', `⌨️ - Initializing a custom query parser.`);

  return await baseInitQueryParserBuilder({
    API,
    QUERY_PARSER_OPTIONS: {
      allowEmptySearch: true,
      allowUnknownParams: true,
      allowDefault: true,
      allowUnorderedParams: true,
    },
    log,
  });
}

export default location(autoService(initQueryParserBuilder), import.meta.url);
