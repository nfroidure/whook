import { initCronsHandlers } from '@whook/whook';
import { location } from 'knifecycle';
import wrapCronsHandlersWithOTel from '../wrappers/wrapCronsHandlersWithOTel.js';

export default location(
  wrapCronsHandlersWithOTel(initCronsHandlers),
  import.meta.url,
);
