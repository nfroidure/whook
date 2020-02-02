import initObfuscator from './obfuscator';

describe('Obfuscator Service', () => {
  const log = jest.fn();
  let obfuscator;

  beforeEach(() => {
    log.mockReset();
  });
  beforeAll(async () => {
    obfuscator = await initObfuscator({ log });
  });

  describe('obfuscate()', () => {
    it('should work with short secrets', () => {
      expect(obfuscator.obfuscate('abba12')).toMatchInlineSnapshot(`"🛡"`);
    });

    it('should work with odd secrets', () => {
      expect(obfuscator.obfuscate('odd secret')).toMatchInlineSnapshot(
        `"o...t"`,
      );
    });

    it('should work with long secrets', () => {
      expect(obfuscator.obfuscate('a long secret')).toMatchInlineSnapshot(
        `"a ...t"`,
      );
    });
    it('should work with very long secrets', () => {
      expect(
        obfuscator.obfuscate('a very long secret to obfuscate'),
      ).toMatchInlineSnapshot(`"a v...ate"`);
    });

    it('should work with uuids', () => {
      expect(
        obfuscator.obfuscate('abbacaca-abba-caca-abba-cacaabbacaca'),
      ).toMatchInlineSnapshot(`"abb...aca"`);
    });
  });

  describe('obfuscateSensibleHeaders()', () => {
    it('should work with no headers', () => {
      expect(obfuscator.obfuscateSensibleHeaders({})).toMatchInlineSnapshot(
        `Object {}`,
      );
    });

    it('should work with some sensible headers', () => {
      expect(
        obfuscator.obfuscateSensibleHeaders({
          Cookie: 'sessid=yolo',
          Authorization: 'Bearer xxxxx',
          'user-agent': 'yolo browser',
        }),
      ).toMatchInlineSnapshot(`
        Object {
          "Authorization": "Bearer 🛡",
          "Cookie": "s...o",
          "user-agent": "yolo browser",
        }
      `);
    });

    it('should work with no sensible headers', () => {
      expect(
        obfuscator.obfuscateSensibleHeaders({
          'user-agent': 'yolo browser',
        }),
      ).toMatchInlineSnapshot(`
        Object {
          "user-agent": "yolo browser",
        }
      `);
    });

    it('should work with undefined sensible headers', () => {
      expect(
        obfuscator.obfuscateSensibleHeaders({
          Authorization: undefined,
        }),
      ).toMatchInlineSnapshot(`
        Object {
          "Authorization": "🛡",
        }
      `);
    });
  });

  describe('obfuscateSensibleProps()', () => {
    it('should work with no props', () => {
      expect(obfuscator.obfuscateSensibleProps({})).toMatchInlineSnapshot(
        `Object {}`,
      );
    });

    it('should work with some sensible props', () => {
      expect(
        obfuscator.obfuscateSensibleProps({
          username: 'marco@po.lo',
          password: 'yolo#!123',
        }),
      ).toMatchInlineSnapshot(`
        Object {
          "password": "y...3",
          "username": "marco@po.lo",
        }
      `);
    });

    it('should work with no sensible headers', () => {
      expect(
        obfuscator.obfuscateSensibleProps({
          username: 'jean',
        }),
      ).toMatchInlineSnapshot(`
        Object {
          "username": "jean",
        }
      `);
    });

    it('should work with AWS events', () => {
      expect(
        obfuscator.obfuscateSensibleProps({
          resource: '/users/{userId}/views/{viewId}',
          path: '/v1/users/15419/views/3257',
          httpMethod: 'PUT',
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, sdch, br',
            'Accept-Language': 'fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4',
            Authorization:
              'Bearer 4233508cf986867e0dead433a3c02028573b37b8121ef37c2b2111b8cdcf1d38b9b43871a0d8cdd4c457c18d1af29f16fbda329cf4c887449edaaa25cd52f5cd39c8c68e7ca7aa65d8b9df28793be8d3f07de0ef382f5bf62ccc1f45e9790eab1f0f378dece69f4c57b46af431becb8dfcfb0881070ebdebd22c57ff086e4908',
            'CloudFront-Forwarded-Proto': 'https',
            'CloudFront-Is-Desktop-Viewer': 'false',
            'CloudFront-Is-Mobile-Viewer': 'true',
            'CloudFront-Is-SmartTV-Viewer': 'false',
            'CloudFront-Is-Tablet-Viewer': 'false',
            'CloudFront-Viewer-Country': 'FR',
            'content-type': 'application/json;charset=UTF-8',
            Host: 'api.example.com',
            origin: 'https://app.example.com',
            Referer: 'https://app.example.com/views/3257/edit',
            'User-Agent':
              'Mozilla/5.0 (Linux; Android 5.0.2; SM-G360F Build/LRX22G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.83 Mobile Safari/537.36',
            'X-Forwarded-Port': '443',
            'X-Forwarded-Proto': 'https',
          },
          multiValueHeaders: {
            Accept: ['application/json, text/plain, */*'],
            'Accept-Encoding': ['gzip, deflate, sdch, br'],
            'Accept-Language': ['fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4'],
            Authorization: [
              'Bearer 4233508cf986867e0dead433a3c02028573b37b8121ef37c2b2111b8cdcf1d38b9b43871a0d8cdd4c457c18d1af29f16fbda329cf4c887449edaaa25cd52f5cd39c8c68e7ca7aa65d8b9df28793be8d3f07de0ef382f5bf62ccc1f45e9790eab1f0f378dece69f4c57b46af431becb8dfcfb0881070ebdebd22c57ff086e4908',
            ],
            'CloudFront-Forwarded-Proto': ['https'],
            'CloudFront-Is-Desktop-Viewer': ['false'],
            'CloudFront-Is-Mobile-Viewer': ['true'],
            'CloudFront-Is-SmartTV-Viewer': ['false'],
            'CloudFront-Is-Tablet-Viewer': ['false'],
            'CloudFront-Viewer-Country': ['FR'],
            'content-type': ['application/json;charset=UTF-8'],
            Host: ['api.example.com'],
            origin: ['https://app.example.com'],
            Referer: ['https://app.example.com/views/3257/edit'],
            'User-Agent': [
              'Mozilla/5.0 (Linux; Android 5.0.2; SM-G360F Build/LRX22G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.83 Mobile Safari/537.36',
            ],
            'X-Forwarded-Port': ['443'],
            'X-Forwarded-Proto': ['https'],
          },
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          pathParameters: {
            userId: '15419',
            viewId: '3257',
          },
          stageVariables: null,
          requestContext: {
            resourceId: '8m3dw9',
            resourcePath: '/users/{userId}/views/{viewId}',
            httpMethod: 'PUT',
            extendedRequestId: 'S-D5rG9QFiAFnVg=',
            requestTime: '04/Jan/2019:08:31:19 +0000',
            path: '/v1/users/15419/views/3257',
            accountId: '812957082909',
            protocol: 'HTTP/1.1',
            stage: 'production',
            domainPrefix: 'api',
            requestTimeEpoch: 1546590679565,
            requestId: '1c305c71-0ffb-11e9-8030-0be055acbee0',
            identity: {
              cognitoIdentityPoolId: null,
              accountId: null,
              cognitoIdentityId: null,
              caller: null,
              sourceIp: '176.179.150.172',
              accessKey: null,
              cognitoAuthenticationType: null,
              cognitoAuthenticationProvider: null,
              userArn: null,
              userAgent:
                'Mozilla/5.0 (Linux; Android 5.0.2; SM-G360F Build/LRX22G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.83 Mobile Safari/537.36',
              user: null,
            },
            domainName: 'api.example.com',
            apiId: 'gxwjtgp8bf',
          },
          body: '{"contents":{"name":"lol ","password":"disabled"}}',
          isBase64Encoded: false,
        }),
      ).toMatchInlineSnapshot(`
        Object {
          "body": "{\\"contents\\":{\\"name\\":\\"lol \\",\\"password\\":\\"disabled\\"}}",
          "headers": Object {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, sdch, br",
            "Accept-Language": "fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4",
            "Authorization": "Bearer 423...908",
            "CloudFront-Forwarded-Proto": "https",
            "CloudFront-Is-Desktop-Viewer": "false",
            "CloudFront-Is-Mobile-Viewer": "true",
            "CloudFront-Is-SmartTV-Viewer": "false",
            "CloudFront-Is-Tablet-Viewer": "false",
            "CloudFront-Viewer-Country": "FR",
            "Host": "api.example.com",
            "Referer": "https://app.example.com/views/3257/edit",
            "User-Agent": "Mozilla/5.0 (Linux; Android 5.0.2; SM-G360F Build/LRX22G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.83 Mobile Safari/537.36",
            "X-Forwarded-Port": "443",
            "X-Forwarded-Proto": "https",
            "content-type": "application/json;charset=UTF-8",
            "origin": "https://app.example.com",
          },
          "httpMethod": "PUT",
          "isBase64Encoded": false,
          "multiValueHeaders": Object {
            "Accept": Array [
              "application/json, text/plain, */*",
            ],
            "Accept-Encoding": Array [
              "gzip, deflate, sdch, br",
            ],
            "Accept-Language": Array [
              "fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4",
            ],
            "Authorization": Array [
              "Bearer 423...908",
            ],
            "CloudFront-Forwarded-Proto": Array [
              "https",
            ],
            "CloudFront-Is-Desktop-Viewer": Array [
              "false",
            ],
            "CloudFront-Is-Mobile-Viewer": Array [
              "true",
            ],
            "CloudFront-Is-SmartTV-Viewer": Array [
              "false",
            ],
            "CloudFront-Is-Tablet-Viewer": Array [
              "false",
            ],
            "CloudFront-Viewer-Country": Array [
              "FR",
            ],
            "Host": Array [
              "api.example.com",
            ],
            "Referer": Array [
              "https://app.example.com/views/3257/edit",
            ],
            "User-Agent": Array [
              "Mozilla/5.0 (Linux; Android 5.0.2; SM-G360F Build/LRX22G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.83 Mobile Safari/537.36",
            ],
            "X-Forwarded-Port": Array [
              "443",
            ],
            "X-Forwarded-Proto": Array [
              "https",
            ],
            "content-type": Array [
              "application/json;charset=UTF-8",
            ],
            "origin": Array [
              "https://app.example.com",
            ],
          },
          "multiValueQueryStringParameters": null,
          "path": "/v1/users/15419/views/3257",
          "pathParameters": Object {
            "userId": "15419",
            "viewId": "3257",
          },
          "queryStringParameters": null,
          "requestContext": Object {
            "accountId": "812957082909",
            "apiId": "gxwjtgp8bf",
            "domainName": "api.example.com",
            "domainPrefix": "api",
            "extendedRequestId": "S-D5rG9QFiAFnVg=",
            "httpMethod": "PUT",
            "identity": Object {
              "accessKey": null,
              "accountId": null,
              "caller": null,
              "cognitoAuthenticationProvider": null,
              "cognitoAuthenticationType": null,
              "cognitoIdentityId": null,
              "cognitoIdentityPoolId": null,
              "sourceIp": "176.179.150.172",
              "user": null,
              "userAgent": "Mozilla/5.0 (Linux; Android 5.0.2; SM-G360F Build/LRX22G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.83 Mobile Safari/537.36",
              "userArn": null,
            },
            "path": "/v1/users/15419/views/3257",
            "protocol": "HTTP/1.1",
            "requestId": "1c305c71-0ffb-11e9-8030-0be055acbee0",
            "requestTime": "04/Jan/2019:08:31:19 +0000",
            "requestTimeEpoch": 1546590679565,
            "resourceId": "8m3dw9",
            "resourcePath": "/users/{userId}/views/{viewId}",
            "stage": "production",
          },
          "resource": "/users/{userId}/views/{viewId}",
          "stageVariables": null,
        }
      `);
    });
  });
});
