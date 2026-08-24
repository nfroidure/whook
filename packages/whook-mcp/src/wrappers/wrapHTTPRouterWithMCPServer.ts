import { type WhookAuthenticationService } from '@whook/authorization';
import {
  type WhookHTTPRouterProvider,
  type WhookHTTPRouterService,
  castWhookHeaders,
  pickFirstHeaderValue,
} from '@whook/whook';

import { toNodeHandler } from '@modelcontextprotocol/node';
import { type LogService, noop } from 'common-services';
import { alsoInject, wrapInitializer } from 'knifecycle';
import { type Dependencies, type ProviderInitializer } from 'knifecycle';
import { type IncomingMessage, type ServerResponse } from 'node:http';
import { hasYErrorCode, printStackTrace } from 'yerror';
import { YHTTPError } from 'yhttperror';

import {
  type WhookMCPOptions,
  type WhookMCPHandlerService,
} from '../services/mcpHandler.js';

export interface BearerPayload {
  hash: string;
}
export interface WhookMCPServerConfig {
  MCP_OPTIONS: WhookMCPOptions;
}
export type WhookMCPServerDependencies = WhookMCPServerConfig & {
  mcpHandler: WhookMCPHandlerService;
  authentication: WhookAuthenticationService<BearerPayload>;
  log?: LogService;
};

export default function wrapHTTPRouterWithMCPServer<D extends Dependencies>(
  initHTTPRouter: ProviderInitializer<D, WhookHTTPRouterService>,
): ProviderInitializer<D & WhookMCPServerDependencies, WhookHTTPRouterService> {
  const augmentedInitializer = alsoInject<
    WhookMCPServerDependencies,
    D,
    WhookHTTPRouterService
  >(['MCP_OPTIONS', 'mcpHandler', 'authentication', '?log'], initHTTPRouter);

  return wrapInitializer(
    async (
      {
        MCP_OPTIONS,
        mcpHandler,
        authentication,
        log = noop,
      }: WhookMCPServerDependencies,
      httpRouter: WhookHTTPRouterProvider,
    ) => {
      log(
        'warning',
        `💁 - Serving API through MCP (path: ${MCP_OPTIONS.path})`,
      );

      if (MCP_OPTIONS.securityKeys.length === 0) {
        log('warning', '⚠️ - MCP server is publicly available!');
      }

      const nodeHandler = toNodeHandler(mcpHandler);

      const checkAuthentication = async (req: IncomingMessage) => {
        const authorization = pickFirstHeaderValue(
          'authorization',
          castWhookHeaders(req.headers),
        );

        if (!authorization) {
          throw new YHTTPError(401, 'E_UNAUTHORIZED');
        }

        const [type, data] = (authorization || '').split(/\s+/, 2);

        if (type.toLowerCase() !== 'bearer' || !data) {
          throw new YHTTPError(401, 'E_UNAUTHORIZED', [type]);
        }

        const authenticationData = await authentication.check('bearer', {
          hash: data,
        });

        log('debug', '➕ - MCP request authenticated');
        return authenticationData;
      };

      async function customHTTPRouter(
        req: IncomingMessage,
        res: ServerResponse,
      ) {
        const url = req.url?.split('?', 1)[0];

        if (
          url &&
          (url === MCP_OPTIONS.path || url.startsWith(MCP_OPTIONS.path + '/'))
        ) {
          try {
            if (MCP_OPTIONS.securityKeys.length) {
              (req as unknown as { auth: unknown }).auth =
                await checkAuthentication(req);
            }
          } catch (err) {
            const castedErr = hasYErrorCode(err, 'E_UNAUTHORIZED');

            if (castedErr) {
              // TODO: Eventually allow the MCP server for
              // anonymous requests later. The main problem
              // is that the MCP protocol errors seem to
              // not allow generating a 401/403 inside the
              // MCP handler. An MCP server is then either
              // protected or anonymous, AFAIK.
              log('debug', '➕ - Authentication required');
              log('debug-stack', printStackTrace(err));
              res.statusCode = 401;
              res.setHeader('WWW-Authenticate', 'Bearer');
              res.end();
              return;
            }

            log('error', '💥 - Unexpected MCP error!');
            log('error-stack', printStackTrace(err));
            res.statusCode = 500;
            res.end();
            return;
          }

          return nodeHandler(req, res);
        }
        return httpRouter.service(req, res);
      }

      return {
        ...httpRouter,
        service: customHTTPRouter,
      };
    },
    augmentedInitializer,
  );
}
