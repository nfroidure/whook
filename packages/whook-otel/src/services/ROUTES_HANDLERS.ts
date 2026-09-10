import { initRoutesHandlers } from '@whook/whook';
import { location } from 'knifecycle';
import wrapRoutesHandlersWithOTel from '../wrappers/wrapRoutesHandlersWithOTel.js';

export default location(
  wrapRoutesHandlersWithOTel(initRoutesHandlers),
  import.meta.url,
);
