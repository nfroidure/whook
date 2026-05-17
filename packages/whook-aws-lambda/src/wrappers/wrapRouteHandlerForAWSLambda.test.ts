import stream from 'node:stream';
import { describe, expect, test } from '@jest/globals';
import {
  type ALBEvent,
  type ALBResult,
  type CloudFrontRequestEvent,
  type CloudFrontResultResponse,
} from 'aws-lambda';
import { type WhookResponse, type WhookRouteDefinition } from '@whook/whook';
import {
  extractPathParameters,
  normalizeAWSRequestEvent,
  responseToAWSResponseEvent,
} from './wrapRouteHandlerForAWSLambda.js';

const definition = {
  path: '/users/{userId}/files/{fileId}',
  method: 'get',
  operation: {
    operationId: 'getUserFile',
    responses: {},
  },
} as const satisfies WhookRouteDefinition;

function createResponse(
  body: string | Buffer,
  headers: WhookResponse['headers'] = {
    'content-type': 'text/plain',
  },
): WhookResponse {
  const bodyStream = new stream.PassThrough();

  bodyStream.end(body);

  return {
    status: 200,
    headers,
    body: bodyStream,
  };
}

describe('normalizeAWSRequestEvent', () => {
  test('should normalize ALB events', () => {
    const event: ALBEvent = {
      requestContext: {
        elb: {
          targetGroupArn: 'arn:aws:elasticloadbalancing:::targetgroup/test',
        },
      },
      httpMethod: 'GET',
      path: '/users/42/files/report%20final.pdf',
      queryStringParameters: {
        search: 'latest',
      },
      headers: {
        'user-agent': 'test-alb',
      },
      body: null,
      isBase64Encoded: false,
    };

    expect(normalizeAWSRequestEvent(definition, event)).toEqual({
      source: 'alb',
      body: null,
      headers: {
        'user-agent': 'test-alb',
      },
      httpMethod: 'GET',
      isBase64Encoded: false,
      multiValueHeaders: {},
      multiValueQueryStringParameters: {
        search: ['latest'],
      },
      path: '/users/42/files/report%20final.pdf',
      pathParameters: {
        userId: '42',
        fileId: 'report final.pdf',
      },
      requestId: 'no_id',
      requestTimeEpoch: 0,
      resourcePath: '/users/{userId}/files/{fileId}',
      userAgent: 'test-alb',
    });
  });

  test('should normalize CloudFront request events', () => {
    const event: CloudFrontRequestEvent = {
      Records: [
        {
          cf: {
            config: {
              distributionDomainName: 'example.cloudfront.net',
              distributionId: 'dist-id',
              eventType: 'viewer-request',
              requestId: 'cloudfront-request-id',
            },
            request: {
              clientIp: '127.0.0.1',
              method: 'GET',
              uri: '/users/42/files/report%20final.pdf',
              querystring: 'search=latest&search=archived',
              headers: {
                'user-agent': [{ value: 'test-cloudfront' }],
                accept: [{ value: 'application/json' }],
              },
            },
          },
        },
      ],
    };

    expect(normalizeAWSRequestEvent(definition, event)).toEqual({
      source: 'cloudfront',
      body: null,
      headers: {
        'user-agent': 'test-cloudfront',
        accept: 'application/json',
      },
      httpMethod: 'GET',
      isBase64Encoded: false,
      multiValueHeaders: {
        'user-agent': ['test-cloudfront'],
        accept: ['application/json'],
      },
      multiValueQueryStringParameters: {
        search: ['latest', 'archived'],
      },
      path: '/users/42/files/report%20final.pdf',
      pathParameters: {
        userId: '42',
        fileId: 'report final.pdf',
      },
      requestId: 'cloudfront-request-id',
      requestTimeEpoch: 0,
      resourcePath: '/users/{userId}/files/{fileId}',
      userAgent: 'test-cloudfront',
    });
  });
});

describe('extractPathParameters', () => {
  test('should decode route parameters from request paths', () => {
    expect(
      extractPathParameters(
        '/users/{userId}/files/{fileId}',
        '/users/42/files/report%20final.pdf',
      ),
    ).toEqual({
      userId: '42',
      fileId: 'report final.pdf',
    });
  });
});

describe('responseToAWSResponseEvent', () => {
  test('should convert responses to ALB results', async () => {
    const result = (await responseToAWSResponseEvent(
      createResponse(Buffer.from('%PDF-1.4'), {
        'content-type': 'application/pdf',
        'set-cookie': ['a=1', 'b=2'],
      }),
      'alb',
    )) as ALBResult;

    expect(result).toEqual({
      statusCode: 200,
      headers: {
        'content-type': 'application/pdf',
      },
      multiValueHeaders: {
        'set-cookie': ['a=1', 'b=2'],
      },
      body: Buffer.from('%PDF-1.4').toString('base64'),
      isBase64Encoded: true,
    });
  });

  test('should convert responses to CloudFront results', async () => {
    const result = (await responseToAWSResponseEvent(
      createResponse('ok', {
        'content-type': 'text/plain',
        'cache-control': 'max-age=60',
        'set-cookie': ['a=1', 'b=2'],
      }),
      'cloudfront',
    )) as CloudFrontResultResponse;

    expect(result).toEqual({
      status: '200',
      headers: {
        'content-type': [{ value: 'text/plain' }],
        'cache-control': [{ value: 'max-age=60' }],
        'set-cookie': [{ value: 'a=1' }, { value: 'b=2' }],
      },
      body: 'ok',
      bodyEncoding: 'text',
    });
  });
});
