import { autoService, location } from 'knifecycle';
import { qsStrict as strictQs } from 'strict-qs';

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
async function initQueryParserBuilder() {
  const queryParser = strictQs.bind(null, {
    allowEmptySearch: true,
    allowUnknownParams: true,
    allowDefault: true,
    allowUnorderedParams: true,
  });

  return async () => queryParser;
}

export default location(autoService(initQueryParserBuilder), import.meta.url);
