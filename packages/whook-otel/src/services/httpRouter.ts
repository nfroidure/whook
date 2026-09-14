import { initHTTPRouter } from '@whook/whook';
import { location } from 'knifecycle';
import wrapHTTPRouterWithOTel from '../wrappers/wrapHTTPRouterWithOTel.js';

export default location(wrapHTTPRouterWithOTel(initHTTPRouter), import.meta.url);
