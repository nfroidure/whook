import { service, location } from 'knifecycle';
import { qsStrict as strictQs } from 'strict-qs';

export default location(
  service(initQueryParser, 'QUERY_PARSER'),
  import.meta.url,
);

/* Architecture Note #4.5: QUERY_PARSER

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
async function initQueryParser() {
  const QUERY_PARSER = strictQs.bind(null, {
    allowEmptySearch: true,
    allowUnknownParams: true,
    allowDefault: true,
    allowUnorderedParams: true,
  });

  return QUERY_PARSER;
}
