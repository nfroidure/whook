import { service, location } from 'knifecycle';

// Let's mock the time starting at a special date
// Not defined as constant for build issues reason
export default location(
  service(
    async () => ({
      isFixed: false,
      mockedTime: Date.parse('2012-01-15T00:00:00Z'),
      referenceTime: Date.now(),
    }),
    'CLOCK_MOCK',
    [],
    true,
  ),
  import.meta.url,
);
