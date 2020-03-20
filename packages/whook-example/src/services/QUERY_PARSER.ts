import { service } from 'knifecycle';
import strictQs from 'strict-qs';

export default service(initQueryParser, 'QUERY_PARSER');

// Thanks to the DI system, you can easily customize
// Whook building block to match your flavor. Here,
// we override the default query parser behavior to
// be less strict
async function initQueryParser() {
  const QUERY_PARSER = strictQs.bind(null, {
    allowEmptySearch: true,
    allowUnknownParams: true,
    allowDefault: true,
    allowUnorderedParams: true,
  });

  return QUERY_PARSER;
}
