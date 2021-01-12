import { name, autoService } from 'knifecycle';
import { noop, identity } from '@whook/whook';
import type { ENVService } from '@whook/whook';
import type { LogService } from 'common-services';

export default name('FILTER_API_TAGS', autoService(initFilterAPITags));

// Small tweak to be able to run only parts of the API
// by filtering endpoints via their tags. This makes of
// this example an anylith (a monolith that can split
// at will into micro-services)
async function initFilterAPITags({
  ENV,
  log = noop,
}: {
  ENV: ENVService;
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
