import { type LogService } from 'common-services';
import {
  type WhookRouteModule,
  type WhookAPIComponentsDeclarationModule,
} from '../types/routes.js';
import { type WhookPluginName } from '../services/WHOOK_RESOLVED_PLUGINS.js';
import {
  type WhookDeclarations,
  type WhookDeclaration,
  type WhookDeclarationsTypesMap,
} from '../types/declarations.js';
import { type WhookCronModule } from '../types/crons.js';
import { type WhookConsumerModule } from '../types/consumers.js';
import { type WhookCommandModule } from '../types/commands.js';
import { type WhookTransformerModule } from '../types/transformers.js';

export function fileIsPatternIgnored(
  ignoredFilePatterns: string[] | undefined,
  file: string,
) {
  return ignoredFilePatterns
    ? ignoredFilePatterns.some((pattern) => new RegExp(pattern).test(file))
    : false;
}

export function matchFileWithPattern(
  fileNamePatterns: [string, ...string[]],
  file: string,
) {
  return fileNamePatterns.map(
    (pattern) => new RegExp(pattern).exec(file)?.[1],
  )[0];
}

export const ASIDE_DECLARATIONS_SUFFIXES = {
  schema: 'Schema',
  parameter: 'Parameter',
  header: 'Header',
  requestBody: 'RequestBody',
  response: 'Response',
  callback: 'Callback',
} as const;

export const ASIDE_DECLARATIONS_PROPERTIES = {
  schema: 'schemas',
  parameter: 'parameters',
  header: 'headers',
  requestBody: 'requestBodies',
  response: 'responses',
  callback: 'callbacks',
} as const;

export function pickDeclarationsContents<
  T extends keyof typeof ASIDE_DECLARATIONS_PROPERTIES,
>(
  declarations: WhookDeclarations,
  type: T,
): Record<string, WhookDeclaration<T>['content']> {
  const declarationsContents: Record<string, WhookDeclaration<T>['content']> =
    {};
  const property = ASIDE_DECLARATIONS_PROPERTIES[type];

  for (const declarationName of Object.keys(declarations[property])) {
    declarationsContents[declarationName] = declarations[property][
      declarationName
    ].content as unknown as WhookDeclarationsTypesMap[T];
  }

  return declarationsContents;
}

export function collectModuleDeclarationsOfType<
  T extends keyof typeof ASIDE_DECLARATIONS_SUFFIXES,
>(
  { log }: { log: LogService },
  context: {
    pluginName: WhookPluginName;
    url: `file:///${string}`;
  },
  module:
    | WhookAPIComponentsDeclarationModule
    | WhookRouteModule
    | WhookCronModule
    | WhookConsumerModule
    | WhookCommandModule
    | WhookTransformerModule,
  declarationsTypes: T[],
) {
  const declarations: WhookDeclaration<T>[] = [];

  for (const declarationType of declarationsTypes) {
    for (const key of Object.keys(module)) {
      if (key.endsWith(ASIDE_DECLARATIONS_SUFFIXES[declarationType])) {
        const declaration = module[key as `${string}Schema`];

        log(
          'debug',
          `📥 - Collecting ${declarationType} "${
            declaration.name
          }" from "${context.url}`,
        );

        declarations.push({
          url: context.url,
          name: declaration.name,
          pluginName: context.pluginName,
          type: declarationType,
          content: declaration as WhookDeclaration<T>['content'],
        });
      }
    }
  }
  return declarations;
}
