import { initConsumersHandlers } from '@whook/whook';
import { location } from 'knifecycle';
import wrapConsumersHandlersWithOTel from '../wrappers/wrapConsumersHandlersWithOTel.js';

export default location(
  wrapConsumersHandlersWithOTel(initConsumersHandlers),
  import.meta.url,
);
