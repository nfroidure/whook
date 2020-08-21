import { autoService } from 'knifecycle';
import YError from 'yerror';
import type { JWTService } from 'jwt-service';
import type {
  AuthenticationService,
  BaseAuthenticationData,
} from '@whook/authorization';

export default autoService(initAuthentication);

export type AuthenticationDependencies = {
  jwtToken: JWTService<AuthenticationData>;
};

export type AuthenticationData = BaseAuthenticationData & {
  userId: string;
};

type FakePayload = AuthenticationData;
type BearerPayload = { hash: string };

// A fake authentication service
async function initAuthentication({
  jwtToken,
}: AuthenticationDependencies): Promise<
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
        try {
          return await jwtToken.verify((data as BearerPayload).hash);
        } catch (err) {
          throw YError.wrap(
            err,
            'E_BAD_BEARER_TOKEN',
            type,
            (data as BearerPayload).hash,
          );
        }
      }
      throw new YError('E_UNEXPECTED_AUTH_TYPE', type);
    },
  };

  return authentication;
}
