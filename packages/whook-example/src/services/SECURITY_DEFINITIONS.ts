import { name, autoService, location } from 'knifecycle';
import { noop, type WhookSecurityDefinitions } from '@whook/whook';
import { type LogService } from 'common-services';

export type SecurityDefinitionsEnv = {
  DEV_MODE?: string;
};
export type SecurityDefinitionsDependencies = {
  ENV: SecurityDefinitionsEnv;
  log?: LogService;
};

/* Architecture Note #3.6: SECURITY_DEFINITIONS

You can add some security definitions to the API via this
 service.
*/
async function initSecurityDefinitions({
  ENV,
  log = noop,
}: SecurityDefinitionsDependencies): Promise<WhookSecurityDefinitions> {
  log('debug', '🔒 - Initializing the SECURITY_DEFINITIONS service!');

  const SECURITY_DEFINITIONS: WhookSecurityDefinitions = {
    security: [],
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        description: 'Bearer authentication with a user API token',
        scheme: 'bearer',
      },
      ...(ENV.DEV_MODE
        ? {
            fakeAuth: {
              type: 'apiKey',
              description: 'A fake authentication for development purpose.',
              name: 'Authorization',
              in: 'header',
            },
          }
        : {}),
    },
  };

  return SECURITY_DEFINITIONS;
}

export default location(
  name('SECURITY_DEFINITIONS', autoService(initSecurityDefinitions)),
  import.meta.url,
);
