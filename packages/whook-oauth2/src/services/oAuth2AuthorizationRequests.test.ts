import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import { type KVStoreService } from 'memory-kv-store';
import { YError } from 'yerror';
import initOAuth2AuthorizationRequests, {
  type WhookOAuth2AuthorizationRequestData,
} from './oAuth2AuthorizationRequests.js';
import { RandomBytesService } from 'common-services';

describe('OAuth2AuthorizationRequests', () => {
  const oAuth2AuthorizationRequestsStore = {
    getDelete:
      jest.fn<
        KVStoreService<WhookOAuth2AuthorizationRequestData>['getDelete']
      >(),
    set: jest.fn<KVStoreService<WhookOAuth2AuthorizationRequestData>['set']>(),
  };
  const randomBytes = jest.fn<RandomBytesService>();
  const time = jest.fn<() => number>();
  const log = jest.fn();

  const CLIENT_ID = 'a_client_id';
  const REQUEST_ID = 'a-request-id-1-2-3';
  const REQUEST_URI =
    'urn:ietf:params:oauth:request_uri:arequestid123' as const;
  const PARAMETERS = {
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: 'https://www.example.com/callback',
    scope: 'user admin',
  };

  beforeEach(() => {
    oAuth2AuthorizationRequestsStore.getDelete.mockReset();
    oAuth2AuthorizationRequestsStore.set.mockReset();
    randomBytes.mockReset();
    time.mockReset();
    log.mockReset();
    randomBytes.mockResolvedValue(Buffer.from(REQUEST_ID));
    time.mockReturnValue(1000);
  });

  test('should create an authorization request with default TTL', async () => {
    const oAuth2AuthorizationRequests = await initOAuth2AuthorizationRequests({
      oAuth2AuthorizationRequestsStore,
      randomBytes,
      time,
      log,
    });

    const result = await oAuth2AuthorizationRequests.create(
      CLIENT_ID,
      PARAMETERS,
    );

    expect({
      result,
      storeSetCalls: oAuth2AuthorizationRequestsStore.set.mock.calls,
      randomBytesCalls: randomBytes.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "logCalls": [
         [
           "debug",
           "👫 - OAuth2AuthorizationRequests Service Initialized!",
         ],
       ],
       "randomBytesCalls": [
         [
           16,
         ],
       ],
       "result": {
         "expiresIn": 90000,
         "requestURI": "urn:ietf:params:oauth:request_uri:YS1yZXF1ZXN0LWlkLTEtMi0z",
       },
       "storeSetCalls": [
         [
           "YS1yZXF1ZXN0LWlkLTEtMi0z",
           {
             "clientId": "a_client_id",
             "expiresAt": 91000,
             "parameters": {
               "client_id": "a_client_id",
               "redirect_uri": "https://www.example.com/callback",
               "response_type": "code",
               "scope": "user admin",
             },
           },
           90000,
         ],
       ],
     }
    `);
  });

  test('should check and consume a valid authorization request', async () => {
    const oAuth2AuthorizationRequests = await initOAuth2AuthorizationRequests({
      OAUTH2_PAR: {
        mode: 'required',
        ttl: 60000,
      },
      oAuth2AuthorizationRequestsStore,
      randomBytes,
      time,
      log,
    });

    oAuth2AuthorizationRequestsStore.getDelete.mockResolvedValue({
      clientId: CLIENT_ID,
      parameters: PARAMETERS,
      expiresAt: 61000,
    });

    const requestData = await oAuth2AuthorizationRequests.check(
      CLIENT_ID,
      REQUEST_URI,
    );

    expect({
      requestData,
      storeGetDeleteCalls:
        oAuth2AuthorizationRequestsStore.getDelete.mock.calls,
      randomBytesCalls: randomBytes.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "logCalls": [
         [
           "debug",
           "👫 - OAuth2AuthorizationRequests Service Initialized!",
         ],
       ],
       "randomBytesCalls": [],
       "requestData": {
         "clientId": "a_client_id",
         "expiresAt": 61000,
         "parameters": {
           "client_id": "a_client_id",
           "redirect_uri": "https://www.example.com/callback",
           "response_type": "code",
           "scope": "user admin",
         },
       },
       "storeGetDeleteCalls": [
         [
           "arequestid123",
         ],
       ],
     }
    `);
  });

  test('should fail when checking a non-existing request URI', async () => {
    const oAuth2AuthorizationRequests = await initOAuth2AuthorizationRequests({
      oAuth2AuthorizationRequestsStore,
      randomBytes,
      time,
      log,
    });

    oAuth2AuthorizationRequestsStore.getDelete.mockResolvedValue(undefined);

    try {
      await oAuth2AuthorizationRequests.check(CLIENT_ID, REQUEST_URI);
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        err,
        storeGetDeleteCalls:
          oAuth2AuthorizationRequestsStore.getDelete.mock.calls,
        randomBytesCalls: randomBytes.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_OAUTH2_BAD_REQUEST_URI (["urn:ietf:params:oauth:request_uri:arequestid123",null,null]): E_OAUTH2_BAD_REQUEST_URI],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2AuthorizationRequests Service Initialized!",
           ],
         ],
         "randomBytesCalls": [],
         "storeGetDeleteCalls": [
           [
             "arequestid123",
           ],
         ],
       }
      `);
    }
  });

  test('should fail and delete request when expired', async () => {
    const oAuth2AuthorizationRequests = await initOAuth2AuthorizationRequests({
      oAuth2AuthorizationRequestsStore,
      randomBytes,
      time,
      log,
    });

    // time() vaut 1000, expiresAt est à 500 (déjà expiré)
    oAuth2AuthorizationRequestsStore.getDelete.mockResolvedValue({
      clientId: CLIENT_ID,
      parameters: PARAMETERS,
      expiresAt: 500,
    });

    try {
      await oAuth2AuthorizationRequests.check(CLIENT_ID, REQUEST_URI);
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        err,
        storeGetDeleteCalls:
          oAuth2AuthorizationRequestsStore.getDelete.mock.calls,
        randomBytesCalls: randomBytes.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_OAUTH2_BAD_REQUEST_URI (["urn:ietf:params:oauth:request_uri:arequestid123",500,1000]): E_OAUTH2_BAD_REQUEST_URI],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2AuthorizationRequests Service Initialized!",
           ],
         ],
         "randomBytesCalls": [],
         "storeGetDeleteCalls": [
           [
             "arequestid123",
           ],
         ],
       }
      `);
    }
  });

  test('should fail when client ID does not match request client ID', async () => {
    const oAuth2AuthorizationRequests = await initOAuth2AuthorizationRequests({
      oAuth2AuthorizationRequestsStore,
      randomBytes,
      time,
      log,
    });

    oAuth2AuthorizationRequestsStore.getDelete.mockResolvedValue({
      clientId: 'other_client_id',
      parameters: PARAMETERS,
      expiresAt: 2000,
    });

    try {
      await oAuth2AuthorizationRequests.check(CLIENT_ID, REQUEST_URI);
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        err,
        storeGetDeleteCalls:
          oAuth2AuthorizationRequestsStore.getDelete.mock.calls,
        randomBytesCalls: randomBytes.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_OAUTH2_CLIENT_MISMATCH (["a_client_id","other_client_id"]): E_OAUTH2_CLIENT_MISMATCH],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2AuthorizationRequests Service Initialized!",
           ],
         ],
         "randomBytesCalls": [],
         "storeGetDeleteCalls": [
           [
             "arequestid123",
           ],
         ],
       }
      `);
    }
  });
});
