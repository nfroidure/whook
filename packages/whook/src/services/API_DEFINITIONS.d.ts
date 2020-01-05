/// <reference types="node" />
/// <reference types="jest" />
import { LogService } from 'common-services';
import { OpenAPIV3 } from 'openapi-types';
declare const _require: NodeRequire;
export declare type WhookAPIDefinitionsDependencies = {
  PROJECT_SRC: string;
  log?: LogService;
  require?: typeof _require;
  readDir?: typeof _readDir;
};
export declare type WhookAPIDefinitions = {
  paths: OpenAPIV3.PathsObject;
  components: OpenAPIV3.ComponentsObject;
};
export declare type WhookAPIHandlerDefinition = {
  path: string;
  method: string;
  operation: OpenAPIV3.OperationObject;
};
export declare type WhookAPISchemaDefinition = {
  name: string;
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;
};
export declare type WhookAPIParameterDefinition = {
  name: string;
  parameter: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject;
};
export declare type WhookAPIHandlerModule = {
  [name: string]:
    | WhookAPISchemaDefinition
    | WhookAPIParameterDefinition
    | WhookAPIHandlerDefinition;
  operation: WhookAPIHandlerDefinition;
};
declare const _default: typeof initAPIDefinitions;
export default _default;
/**
 * Initialize the API_DEFINITIONS service according to the porject handlers.
 * @param  {Object}   services
 * The services API_DEFINITIONS depends on
 * @param  {Object}   services.PROJECT_SRC
 * The project sources location
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
declare function initAPIDefinitions({
  PROJECT_SRC,
  log,
  readDir,
  require,
}: WhookAPIDefinitionsDependencies): Promise<WhookAPIDefinitions>;
declare function _readDir(dir: string): Promise<string[]>;
