'use strict';

import Router from './router';
import NodesSource from './sources/nodes';
import QueryStringSource from './sources/qs';
import StatusDestination from './destinations/status';
import HeadersDestination from './destinations/headers';
import TimeService from './services/time';
import LogService from './services/log';

export default function initWhook() {
  let router = new Router();

  router.source('nodes', NodesSource);
  router.source('qs', QueryStringSource);

  router.destination('status', StatusDestination);
  router.destination('headers', HeadersDestination);

  router.service('time', new TimeService());
  router.service('log', new LogService());

  return router;
}
