import { initHTTPTransaction } from '@whook/whook';
import { location } from 'knifecycle';
import wrapHTTPTransactionWithOTel from '../wrappers/wrapHTTPTransactionWithOTel.js';

export default location(
  wrapHTTPTransactionWithOTel(initHTTPTransaction),
  import.meta.url,
);
