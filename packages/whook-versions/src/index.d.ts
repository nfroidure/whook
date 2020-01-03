import { WhookHandler } from '@whook/whook';
import { ServiceInitializer } from 'knifecycle';
import { OpenAPIV3 } from 'openapi-types';
export declare type VersionDescriptor = {
  header: string;
  rule: string;
};
export declare type VersionsConfig = {
  VERSIONS: VersionDescriptor[];
};
/**
 * Wrap an handler initializer to check versions headers.
 * @param {Function} initHandler The handler initializer
 * @returns {Function} The handler initializer wrapped
 */
export declare function wrapHandlerWithVersionChecker<
  D,
  S extends WhookHandler
>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D & VersionsConfig, S>;
export declare function initHandlerWithVersionChecker<
  D,
  S extends WhookHandler
>(initHandler: ServiceInitializer<D, S>, services: D): Promise<S>;
/**
 * Augment an OpenAPI with versions headers added.
 * @param {Object} API The OpenAPI object
 * @param {Object} VERSIONS The versions configurations
 * @returns {Promise<Object>} The augmented  OpenAPI object
 */
export declare function augmentAPIWithVersionsHeaders(
  API: OpenAPIV3.Document,
  VERSIONS: VersionDescriptor[],
): Promise<{
  paths: OpenAPIV3.PathsObject;
  openapi: string;
  info: OpenAPIV3.InfoObject;
  servers?: OpenAPIV3.ServerObject[];
  components?: OpenAPIV3.ComponentsObject;
  security?: OpenAPIV3.SecurityRequirementObject[];
  tags?: OpenAPIV3.TagObject[];
  externalDocs?: OpenAPIV3.ExternalDocumentationObject;
}>;
