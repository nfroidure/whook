import { autoService } from 'knifecycle';
import { AuthenticationService } from '@whook/authorization';
import YError from 'yerror';

export default autoService(initAuthentication);

type FakePayload = AuthenticationPayload;
type BearerPayload = { hash: string };
type AuthenticationPayload = { userId: number; scopes: string[] };

// A fake authentication service
async function initAuthentication({
  TOKEN,
}: {
  TOKEN: string;
}): Promise<
  AuthenticationService<FakePayload | BearerPayload, AuthenticationPayload>
> {
  const authentication = {
    check: async (
      type: string,
      data: FakePayload | BearerPayload,
    ): Promise<AuthenticationPayload> => {
      if (type === 'fake') {
        return data as FakePayload;
      }
      if (type === 'bearer') {
        if ((data as BearerPayload).hash === TOKEN) {
          return {
            userId: 1,
            scopes: ['admin'],
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
