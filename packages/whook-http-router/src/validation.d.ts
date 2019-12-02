import { SupportedSecurityScheme } from './utils';
import { OpenAPIV3 } from 'openapi-types';
import ajv, { Ajv } from 'ajv';
import { WhookOperation } from '@whook/http-transaction';
export declare function applyValidators(
  operation: WhookOperation,
  validators: {
    [name: string]: ajv.ValidateFunction;
  },
  parameters: any[],
): void;
export declare function prepareBodyValidator(ajv: any, operation: any): any;
export declare function extractOperationSecurityParameters(
  openAPI: OpenAPIV3.Document,
  operation: WhookOperation,
): OpenAPIV3.ParameterObject[];
export declare function extractParametersFromSecuritySchemes(
  securitySchemes: (SupportedSecurityScheme | OpenAPIV3.OpenIdSecurityScheme)[],
): OpenAPIV3.ParameterObject[];
export declare function prepareParametersValidators(
  ajv: Ajv,
  operationId: string,
  parameters: OpenAPIV3.ParameterObject[],
): {
  [name: string]: ajv.ValidateFunction;
};
export declare function _validateParameter(
  parameter: OpenAPIV3.ParameterObject,
  validator: ajv.ValidateFunction,
  value: any,
): void;
export declare function filterHeaders(
  parameters: OpenAPIV3.ParameterObject[],
  headers: {
    [name: string]: string;
  },
): {
  [name: string]: string;
};
