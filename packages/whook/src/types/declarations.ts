import { type WhookRouteDefinition } from '../types/routes.js';
import {
  type WhookAPICallbackDefinition,
  type WhookAPIHeaderDefinition,
  type WhookAPIParameterDefinition,
  type WhookAPIRequestBodyDefinition,
  type WhookAPIResponseDefinition,
  type WhookAPISchemaDefinition,
} from '../types/openapi.js';
import { type WhookCronDefinition } from './crons.js';
import { type WhookConsumerDefinition } from './consumers.js';
import { type WhookTransformerDefinition } from './transformers.js';
import { type WhookCommandDefinition } from './commands.js';
import { type WhookPluginName } from '../services/WHOOK_RESOLVED_PLUGINS.js';

export interface WhookDeclarationsTypesMap {
  parameter: WhookAPIParameterDefinition;
  header: WhookAPIHeaderDefinition;
  response: WhookAPIResponseDefinition;
  requestBody: WhookAPIRequestBodyDefinition;
  callback: WhookAPICallbackDefinition;
  schema: WhookAPISchemaDefinition;
  cron: WhookCronDefinition;
  consumer: WhookConsumerDefinition;
  route: WhookRouteDefinition;
  transformer: WhookTransformerDefinition;
  command: WhookCommandDefinition;
  handler: undefined;
}

export interface WhookDeclaration<
  T extends keyof WhookDeclarationsTypesMap = keyof WhookDeclarationsTypesMap,
> {
  url: `file:///${string}`;
  name: string;
  pluginName: WhookPluginName;
  type: T;
  content: WhookDeclarationsTypesMap[T];
}

export interface WhookDeclarations {
  parameters: Record<string, WhookDeclaration<'parameter'>>;
  headers: Record<string, WhookDeclaration<'header'>>;
  responses: Record<string, WhookDeclaration<'response'>>;
  requestBodies: Record<string, WhookDeclaration<'requestBody'>>;
  callbacks: Record<string, WhookDeclaration<'callback'>>;
  schemas: Record<string, WhookDeclaration<'schema'>>;
  crons: Record<string, WhookDeclaration<'cron'>>;
  consumers: Record<string, WhookDeclaration<'consumer'>>;
  routes: Record<string, WhookDeclaration<'route'>>;
  transformers: Record<string, WhookDeclaration<'transformer'>>;
  commands: Record<string, WhookDeclaration<'command'>>;
  handlers: Record<string, WhookDeclaration<'handler'>>;
}
