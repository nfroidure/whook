import { initializer } from 'knifecycle';
import qs from 'qs';
import { castParameterValue } from '../wrappers/awsHTTPLambda';
import type { WhookQueryStringParser } from '@whook/http-router';

// A custom query parser that mimic the AWS one behavior
// for local development
// WARNING: AWS API Gateway Lambda Proxy does not support
// query params repetition (ie foo=bar&foo=bar2)
// TODO: this parser should reflect that
export default initializer(
  {
    name: 'QUERY_PARSER',
    type: 'service',
    inject: [],
  },
  async () => {
    return (
      ((parameters, search) => {
        const queryStringParameters = qs.parse(search.slice(1));

        return castParameters(
          parameters ? parameters.filter((p) => 'query' === (p as any).in) : [],
          queryStringParameters,
        );
      }) as WhookQueryStringParser
    );
  },
);

function castParameters(parameters, values) {
  const endValues = {};

  (parameters || []).forEach((parameter) => {
    endValues[parameter.name] = castParameterValue(
      parameter,
      values[parameter.name],
    );
  });
  return endValues;
}
