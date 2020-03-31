import { autoService } from 'knifecycle';
import YError from 'yerror';
import type {
  AuthenticationService,
  BaseAuthenticationData,
} from '@whook/authorization';

export default autoService(initAuthentication);

export type AuthenticationConfig = {
  TOKEN: string;
};

export type AuthenticationData = BaseAuthenticationData & {
  userId: string;
};

type FakePayload = AuthenticationData;
type BearerPayload = { hash: string };

// A fake authentication service
async function initAuthentication({
  TOKEN,
}: AuthenticationConfig): Promise<
  AuthenticationService<FakePayload | BearerPayload, AuthenticationData>
> {
  const authentication = {
    check: async (
      type: string,
      data: FakePayload | BearerPayload,
    ): Promise<AuthenticationData> => {
      if (type === 'fake') {
        return data as FakePayload;
      }
      if (type === 'bearer') {
        if ((data as BearerPayload).hash === TOKEN) {
          return {
            applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            userId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
            scope: 'admin',
          };
        }
        throw new YError(
          'E_BAD_BEARER_TOKEN',
          type,
          (data as BearerPayload).hash,
        );
      }
      throw new YError('E_UNEXPECTED_AUTH_TYPE', type);
    },
  };

  return authentication;
}
