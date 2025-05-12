import {
  type WhookAPIParameterDefinition,
  type WhookAPISchemaDefinition,
  type WhookCronsDefinitionsService,
  type WhookCronsHandlersService,
  type WhookRouteDefinition,
  type WhookRouteTypedHandler,
  type WhookSchemaValidatorsService,
  refersTo,
} from '@whook/whook';

import { type LogService } from 'common-services';
import { autoService } from 'knifecycle';
import { type JsonValue } from 'type-fest';
import { YHTTPError } from 'yhttperror';

export const dateSchema = {
  name: 'Date',
  example: '2010-03-06T20:20:02.02Z',
  schema: {
    type: 'string',
    format: 'date-time',
  },
} as const satisfies WhookAPISchemaDefinition<components['schemas']['Date']>;

export const dateQueryParameter: WhookAPIParameterDefinition<
  components['schemas']['Date']
> = {
  name: 'date',
  example: dateSchema.example,
  parameter: {
    name: 'date',
    in: 'query',
    required: true,
    schema: refersTo(dateSchema),
  },
};

export const definition = {
  path: '/crons/{cronName}/run',
  method: 'post',
  config: { environments: ['local', 'test'] },
  operation: {
    operationId: 'postCronRun',
    description:
      'Allow to run crons on the fly for development or testing purposes.',
    security: [
      {
        bearerAuth: ['admin'],
      },
    ],
    tags: ['system'],
    parameters: [
      {
        name: 'cronName',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
      },
      refersTo(dateQueryParameter),
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
    responses: {
      204: {
        description: 'Cron run successfully!',
      },
    },
  },
} as const satisfies WhookRouteDefinition;

async function initPostCronRun({
  CRONS_HANDLERS,
  CRONS_DEFINITIONS,
  schemaValidators,
  log,
}: {
  CRONS_HANDLERS: WhookCronsHandlersService;
  CRONS_DEFINITIONS: WhookCronsDefinitionsService;
  schemaValidators: WhookSchemaValidatorsService;
  log: LogService;
}) {
  const postCronRun: WhookRouteTypedHandler<
    operations[typeof definition.operation.operationId],
    typeof definition
  > = async ({ path: { cronName }, query: { date }, body }) => {
    log(
      'warning',
      `⌚ - Triggering a "${cronName}" cron run through the router.`,
    );

    if (!CRONS_DEFINITIONS[cronName]) {
      throw new YHTTPError(400, 'E_BAD_CRON_NAME', cronName);
    }

    const validator = schemaValidators(
      CRONS_DEFINITIONS[cronName].module.definition.schema,
    );

    validator(body);

    if (validator.errors) {
      throw new YHTTPError(
        400,
        'E_BAD_CRON_BODY',
        cronName,
        body,
        validator.errors,
      );
    }

    await CRONS_HANDLERS[cronName]({
      date,
      body: body as JsonValue,
    });

    return {
      status: 204,
    };
  };

  return postCronRun;
}

export default autoService(initPostCronRun);
