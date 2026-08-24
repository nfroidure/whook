import { initHTTPRouter } from '@whook/whook';
import { location } from 'knifecycle';
import wrapHTTPRouterWithMCPServer from '../wrappers/wrapHTTPRouterWithMCPServer.js';

export default location(
  wrapHTTPRouterWithMCPServer(initHTTPRouter),
  import.meta.url,
);
