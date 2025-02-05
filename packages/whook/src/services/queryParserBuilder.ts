import { location, autoService } from 'knifecycle';
import { type LogService } from 'common-services';
import {
  qsStrict as strictQs,
  type QSParameter,
  type QSOptions,
} from 'strict-qs';
import { type JsonValue } from 'type-fest';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import {
  ensureResolvedObject,
  type OpenAPIExtension,
  type OpenAPIParameter,
} from 'ya-open-api-types';
import { type WhookOpenAPI } from '../types/openapi.js';

export const DEFAULT_QUERY_PARSER_OPTIONS = {};

export type WhookQueryParser = (search: string) => Record<string, JsonValue>;
export type WhookQueryParserBuilderConfig = {
  QUERY_PARSER_OPTIONS?: QSOptions;
};
export type WhookQueryParserBuilderDependencies =
  WhookQueryParserBuilderConfig & {
    API: WhookOpenAPI;
    log: LogService;
  };
export type WhookQueryParserBuilderService = (
  parameters: OpenAPIParameter<ExpressiveJSONSchema, OpenAPIExtension>[],
) => Promise<WhookQueryParser>;

async function initQueryParserBuilder({
  QUERY_PARSER_OPTIONS = DEFAULT_QUERY_PARSER_OPTIONS,
  API,
  log,
}: WhookQueryParserBuilderDependencies): Promise<WhookQueryParserBuilderService> {
  log('warning', `⌨️ - Initializing the basic query parser.`);

  return async (
    parameters: OpenAPIParameter<ExpressiveJSONSchema, OpenAPIExtension>[],
  ) => {
    // TODO: Update strict qs to provide strings only
    const retroCompatibleQueryParameters: QSParameter[] = [];

    for (const parameter of parameters || []) {
      if (parameter.in !== 'query') {
        continue;
      }

      const schema = {
        ...(await ensureResolvedObject(
          API,
          'schema' in parameter && typeof parameter.schema === 'object'
            ? parameter.schema
            : {},
        )),
      };

      if ('items' in schema) {
        schema.items = await ensureResolvedObject(API, schema.items);
      }

      retroCompatibleQueryParameters.push({
        ...parameter,
        ...schema,
      } as unknown as QSParameter);
    }

    return (search: string) => {
      return strictQs(
        QUERY_PARSER_OPTIONS,
        retroCompatibleQueryParameters as unknown as QSParameter[],
        search,
      );
    };
  };
}

export default location(autoService(initQueryParserBuilder), import.meta.url);
