import camelCase from 'camel-case';
import YError from 'yerror';
import HTTPError from 'yhttperror';
import Stream from 'stream';

/* Architecture Note #1.1: Validators
For performance reasons, the validators are
 created once for all at startup from the
 API definition.

One could argue that it would have been
 better for performances to generate
 the code statically. This is true. It
 may be done later but it won't change
 the way it works so, moving fast for
 now but keeping it in mind.

Also, looking closely to Prepack that
 could improve significantly this
 project performances with close to no
 time costs:
 https://github.com/facebook/prepack/issues/522#issuecomment-300706099
*/

export function applyValidators(operation, validators, parameters) {
  (operation.parameters || []).forEach(({ name, in: isIn }) => {
    if ('header' === isIn) {
      return validators[name](parameters[camelCase(name)]);
    }
    return validators[name](parameters[name]);
  });
}

export function prepareBodyValidator(ajv, operation) {
  if (!(operation.requestBody && operation.requestBody.content)) {
    return _rejectAnyRequestBody.bind(null, operation);
  }

  const validators = Object.keys(operation.requestBody.content).reduce(
    (validators, mediaType) => {
      const mediaTypeObject = operation.requestBody.content[mediaType];
      const hasNoSchema = !mediaTypeObject.schema;

      if (hasNoSchema) {
        return validators;
      }

      const isBinaryContent =
        mediaTypeObject.schema.type === 'string' &&
        mediaTypeObject.schema.format === 'binary';

      if (isBinaryContent) {
        return validators;
      }

      return {
        ...validators,
        [mediaType]: ajv.compile(mediaTypeObject.schema),
      };
    },
    {},
  );

  return _validateRequestBody.bind(null, validators);
}

function _validateRequestBody(validators, operation, contentType, value) {
  if (operation.requestBody.required && 'undefined' === typeof value) {
    throw new HTTPError(
      400,
      'E_REQUIRED_REQUEST_BODY',
      operation.operationId,
      typeof value,
      value instanceof Stream ? 'Stream' : value,
    );
  }
  // Streamed contents, let it pass
  if (!validators[contentType]) {
    return;
  }
  if ('undefined' !== typeof value && !validators[contentType](value)) {
    throw new HTTPError(
      400,
      'E_BAD_REQUEST_BODY',
      operation.operationId,
      typeof value,
      value instanceof Stream ? 'Stream' : value,
      validators[contentType].errors,
    );
  }
}

function _rejectAnyRequestBody(operation, value) {
  if ('undefined' !== typeof body) {
    throw new HTTPError(
      400,
      'E_NO_REQUEST_BODY',
      operation.operationId,
      typeof value,
      value instanceof Stream ? 'Stream' : value,
    );
  }
}

export function prepareParametersValidators(ajv, operation) {
  return (operation.parameters || []).reduce((validators, parameter) => {
    if ('string' !== typeof parameter.name) {
      throw new YError('E_BAD_PARAMETER_NAME', operation.operationId);
    }

    if (parameter.content) {
      throw new YError(
        'E_UNSUPPORTED_PARAMETER_DEFINITION',
        operation.operationId,
        'content',
      );
    }

    if (parameter.style && 'simple' !== parameter.style) {
      throw new YError(
        'E_UNSUPPORTED_PARAMETER_DEFINITION',
        operation.operationId,
        'style',
        parameter.style,
      );
    }

    if (!['query', 'header', 'path'].includes(parameter.in)) {
      throw new YError(
        'E_UNSUPPORTED_PARAMETER_DEFINITION',
        operation.operationId,
        'in',
        parameter.in,
      );
    }

    validators[parameter.name] = _validateParameter.bind(
      null,
      parameter,
      ajv.compile(parameter.schema),
    );
    return validators;
  }, {});
}

export function _validateParameter(parameter, validator, value) {
  if (parameter.required && 'undefined' === typeof value) {
    throw new HTTPError(
      400,
      'E_REQUIRED_PARAMETER',
      parameter.name,
      typeof value,
      value,
    );
  }
  if ('undefined' !== typeof value && !validator(value)) {
    throw new HTTPError(
      400,
      'E_BAD_PARAMETER',
      parameter.name,
      typeof value,
      value,
      validator.errors,
    );
  }
}

export function filterHeaders(parameters, headers) {
  return (parameters || [])
    .filter(parameter => 'header' === parameter.in)
    .reduce((filteredHeaders, parameter) => {
      if (headers[parameter.name.toLowerCase()]) {
        filteredHeaders[camelCase(parameter.name)] =
          headers[parameter.name.toLowerCase()];
      }
      return filteredHeaders;
    }, {});
}
