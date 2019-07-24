import { extractParametersFromSecuritySchemes } from './validation';
import YError from 'yerror';

describe('extractParametersFromSecuritySchemes', () => {
  describe('should work', () => {
    it('with no security scheme', () => {
      expect(extractParametersFromSecuritySchemes([])).toMatchSnapshot();
    });

    it('with apiKey in query security scheme', () => {
      expect(
        extractParametersFromSecuritySchemes([
          {
            type: 'apiKey',
            in: 'query',
            name: 'yolo',
          },
        ]),
      ).toMatchSnapshot();
    });

    it('with apiKey in header security scheme', () => {
      expect(
        extractParametersFromSecuritySchemes([
          {
            type: 'apiKey',
            in: 'header',
            name: 'yolo',
          },
        ]),
      ).toMatchSnapshot();
    });

    it('with OAuth security scheme', () => {
      expect(
        extractParametersFromSecuritySchemes([
          {
            type: 'oauth2',
          },
        ]),
      ).toMatchSnapshot();
    });

    it('with OpenId security scheme', () => {
      expect(
        extractParametersFromSecuritySchemes([
          {
            type: 'openIdConnect',
          },
        ]),
      ).toMatchSnapshot();
    });

    it('with header overlapping security schemes', () => {
      expect(
        extractParametersFromSecuritySchemes([
          {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
          },
          {
            type: 'http',
            scheme: 'bearer',
          },
        ]),
      ).toMatchSnapshot();
    });

    it('with query overlapping security schemes', () => {
      expect(
        extractParametersFromSecuritySchemes([
          {
            type: 'apiKey',
            in: 'query',
            name: 'access_token',
          },
          {
            type: 'oauth2',
          },
        ]),
      ).toMatchSnapshot();
    });

    it('with nested security scheme', () => {
      expect(
        extractParametersFromSecuritySchemes([
          {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
          },
          {
            type: 'apiKey',
            in: 'header',
            name: 'yolo',
          },
          {
            type: 'apiKey',
            in: 'query',
            name: 'yolo',
          },
          {
            type: 'apiKey',
            in: 'query',
            name: 'access_token',
          },
          {
            type: 'http',
            scheme: 'bearer',
          },
          {
            type: 'oauth2',
          },
          {
            type: 'openIdConnect',
          },
        ]),
      ).toMatchSnapshot();
    });
  });
  describe('should fail', () => {
    it('with unsupported security scheme', () => {
      try {
        extractParametersFromSecuritySchemes([
          {
            type: 'http',
            scheme: 'mutual',
          },
        ]);
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: err.code,
          errorParams: err.params,
        }).toMatchSnapshot();
      }
    });

    it('with unsupported API scheme source', () => {
      try {
        extractParametersFromSecuritySchemes([
          {
            type: 'apiKey',
            in: 'cookie',
            name: 'access_token',
          },
        ]);
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: err.code,
          errorParams: err.params,
        }).toMatchSnapshot();
      }
    });
  });
});
